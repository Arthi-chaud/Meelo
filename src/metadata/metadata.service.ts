import { Injectable, Logger } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { Metadata } from './models/metadata';
import mm, { type IAudioMetadata } from 'music-metadata';
import { FileDoesNotExistException, FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
import { FileParsingException, PathParsingException } from './metadata.exceptions';
import { SettingsService } from 'src/settings/settings.service';
import { TrackService } from 'src/track/track.service';
import { SongService } from 'src/song/song.service';
import { Release, Song, TrackType, AlbumType, File, Artist, Track, Prisma} from '@prisma/client';
import { ReleaseService } from 'src/release/release.service';
import { AlbumService } from 'src/album/album.service';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { TrackQueryParameters } from 'src/track/models/track.query-parameters';

@Injectable()
export class MetadataService {
	public readonly metadataFolderPath;
	constructor(
		private trackService: TrackService,
		private songService: SongService,
		private albumService: AlbumService,
		private artistService: ArtistService,
		private releaseService: ReleaseService,
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService) {
		this.metadataFolderPath = `${this.fileManagerService.configFolderPath}/metadata`;
	}

	/**
	 * Pushed the metadata to the database, calling services
	 * @param metadata the metadata instance to push
	 * @param file the file to register the metadata under, it must be already registered
	 */
	async registerMetadata(metadata : Metadata, file: File): Promise<Track> {
		let artist = metadata.albumArtist ? await this.artistService.getOrCreateArtist({ name: metadata.albumArtist }) : undefined
		let song = await this.songService.getOrCreateSong(
			{ name: metadata.name!, artist: { slug: new Slug(metadata.artist ?? metadata.albumArtist!) }},
			{ instances: true });
		let album = await this.albumService.getOrCreateAlbum({
			name: metadata.album ?? metadata.release!,
			artist: artist ? { id: artist?.id} : undefined
		}, { releases: true });
		let release = await this.releaseService.getOrCreateRelease({
			title: metadata.release ?? metadata.album!,
			master: album.releases.length == 0,
			releaseDate: metadata.releaseDate,
			album: { byId: { id: album.id } }
		}, { album: true });
		let track: TrackQueryParameters.CreateInput = {
			displayName: metadata.name!,
			master: song.instances.length == 0,
			discIndex: metadata.discIndex ?? null,
			trackIndex: metadata.index ?? null,
			type: metadata.type!,
			bitrate: Math.floor(metadata.bitrate ?? 0),
			ripSource: null,
			duration: Math.floor(metadata.duration ?? 0),
			sourceFile: { id: file.id },
			release: { byId: { id: release.id } },
			song: { byId: { id: song.id } }
		};
		if ((release.releaseDate !== null &&
			release.album.releaseDate !== null &&
			release.album.releaseDate > release.releaseDate) || 
			release.releaseDate !== undefined)
			release.album.releaseDate = release.releaseDate;
		release.album.type = metadata.compilation ? AlbumType.Compilation : release.album.type;
		await this.albumService.updateAlbum({ ...release.album }, { byId: { id: release.albumId }});
		release.releaseDate = metadata.releaseDate ?? null;
		await this.releaseService.updateRelease({ releaseDate: release.releaseDate ?? undefined }, { byId: { id: release.id } });
		return await this.trackService.createTrack(track);
	}

	/**
	 * Parses a file's metadata from its embedded data and its path
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadata(filePath: string): Promise<Metadata> {
		let fileMetadata: Metadata = await this.parseMetadataFromFile(filePath);
		
		if (this.settingsService.settingsValues.mergeMetadataWithPathRegexGroup) {
			const metadataFromPath: Metadata = this.parseMetadataFromPath(filePath);
			fileMetadata.discIndex = metadataFromPath.discIndex ?? fileMetadata.discIndex;
			fileMetadata.index = metadataFromPath.index ?? fileMetadata.index;
			fileMetadata.release = metadataFromPath.release ?? fileMetadata.release;
			fileMetadata.releaseDate = metadataFromPath.releaseDate ?? fileMetadata.releaseDate;
			fileMetadata.albumArtist = metadataFromPath.albumArtist ?? fileMetadata.albumArtist;
		}
		return fileMetadata;
	}

	/**
	 * Parses a file's metadata from its embedded data
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	private async parseMetadataFromFile(filePath: string): Promise<Metadata> {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		if (!this.fileManagerService.fileIsReadable(filePath)) {
			throw new FileNotReadableException(filePath);
		}
		try {
			const rawMetadata = await mm.parseFile(filePath, {
				duration: true,
				skipCovers: true,
				includeChapters: false,
			});
			return this.buildMetadataFromRaw(rawMetadata);
		} catch {
			throw new FileParsingException(filePath);
		}
	}

	/**
	 * Parses a File path and 
	 * @param filePath a path (full or not) to a file
	 * @returns returns Metadata object with values from the capture groups of the regex in settings file
	 */
	public parseMetadataFromPath(filePath: string): Metadata {
		try {
			let matchingRegex: RegExpMatchArray = this.settingsService.settingsValues.trackRegex
				.map((regex) => filePath.match(regex))
				.find((regexMatch) => regexMatch != null)!;
			let groups = matchingRegex.groups!;
			return {
				albumArtist: groups['Artist'] ?? undefined,
				release: groups['Release'] ?? undefined,
				album: groups['Album'] ?? undefined,
				releaseDate: groups['Year'] ? new Date(groups['Year']) : undefined,
				discIndex: groups['Disc'] ? parseInt(groups['Disc']) : undefined,
				index: groups['Index'] ? parseInt(groups['Index']) : undefined,
				name: groups['Track']
			}
		} catch {
			throw new PathParsingException(filePath);
		}
	}

	private buildMetadataFromRaw(rawMetadata: IAudioMetadata): Metadata {
		let isVideo: boolean = rawMetadata.format.trackInfo.findIndex((track) => track.video != null) != -1;
		return {
			compilation: rawMetadata.common.compilation ?? false,
			artist: rawMetadata.common.artist,
			albumArtist: rawMetadata.common.albumartist,
			album: rawMetadata.common.album,
			release: rawMetadata.common.album,
			name: rawMetadata.common.title,
			index: rawMetadata.common.track.no ?? undefined,
			discIndex: rawMetadata.common.disk.no ?? undefined,
			bitrate: rawMetadata.format.bitrate ? Math.floor(rawMetadata.format.bitrate / 1000) : undefined,
			duration: rawMetadata.format.duration ? Math.floor(rawMetadata.format.duration) : undefined,
			releaseDate: rawMetadata.common.date ? new Date(rawMetadata.common.date) : undefined,
			type: isVideo ? TrackType.Video : TrackType.Audio
		};
	}


	
	/**
	 * Extract an extension from a release name
	 * For example, if the release Name is 'My Album (Deluxe Edition)', it would return
	 * '(Deluxe Edition)'
	 * @param releaseName 
	 */
	extractReleaseExtension(releaseName: string): string | null {
		const delimiters = [
			['(', ')'],
			['{', '}'],
			['[', ']']
		];
		const extensionKeywords = [
			'Edition',
			'Version',
			'Reissue',
			'Deluxe',
			'Standard',
			'Edited',
			'Explicit'
		];
		const extensionsGroup = extensionKeywords.map((ext) => `(${ext})`).join('|');
		for (const delimiter of delimiters) {
			const regExp = `\\s+(?<extension>\\${delimiter[0]}.*(${extensionsGroup}).*\\${delimiter[1]})`;
			let match = releaseName.match(regExp);
			if (match)
				return match[1];
		}
		return null;
	}

	/**
	 * Removes an extension from a release's name
	 * For example, if the release Name is 'My Album (Deluxe Edition)', the parent
	 * album name would be 'My Album'
	 */
	removeReleaseExtension(releaseName: string): string {
		const extension: string | null = this.extractReleaseExtension(releaseName);
		if (extension !== null) {
			return releaseName.replace(extension, "").trim();
		}
		return releaseName;
	}

}
