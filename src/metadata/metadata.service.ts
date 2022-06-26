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

@Injectable()
export class MetadataService {
	public readonly metadataFolderPath;
	constructor(
		private trackService: TrackService,
		private songService: SongService,
		private albumService: AlbumService,
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
		let song = await this.songService.findOrCreateSong(metadata.artist ?? metadata.albumArtist!, metadata.name!, { instances: true });
		let release = await this.releaseService.findOrCreateRelease(
			metadata.release ?? metadata.album!,
			metadata.album!,
			metadata.albumArtist,
			metadata.releaseDate,
			{ album: true }
		);
		let track: Omit<Track, 'id'> = {
			songId: song.id,
			sourceFileId: file.id,
			releaseId: release.id,
			displayName: metadata.name!,
			master: song.instances.length == 0,
			discIndex: metadata.discIndex ?? null,
			trackIndex: metadata.index ?? null,
			type: metadata.type!,
			bitrate: Math.floor(metadata.bitrate ?? 0),
			ripSource: null,
			duration: Math.floor(metadata.duration ?? 0),
		};
		if ((release.releaseDate !== null &&
			release.album.releaseDate !== null &&
			release.album.releaseDate > release.releaseDate) || 
			release.releaseDate !== undefined)
			release.album.releaseDate = release.releaseDate;
		release.album.type = metadata.compilation ? AlbumType.Compilation : release.album.type;
		await this.albumService.updateAlbum({ ...release.album}, { byId: { id: release.albumId }});
		release.releaseDate = metadata.releaseDate ?? null;
		await this.releaseService.updateRelease(release);
		return await this.trackService.saveTrack(track);
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

}
