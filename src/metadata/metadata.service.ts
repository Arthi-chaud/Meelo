import { Injectable, Logger } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { Metadata } from './models/metadata';
import mm, { IAudioMetadata } from 'music-metadata';
import { FileNotFoundException, FileNotReadableException } from 'src/file/file.exceptions';
import { FileParsingException, PathParsingException } from './metadata.exceptions';
import { SettingsService } from 'src/settings/settings.service';
import { File } from 'src/file/models/file.model';
import { ArtistService } from 'src/artist/artist.service';
import { Artist } from 'src/artist/models/artist.model';
import { Slug } from 'src/slug/slug';
import { Track } from 'src/track/models/track.model';
import { TrackService } from 'src/track/track.service';
import { SongService } from 'src/song/song.service';
import { Song } from 'src/song/models/song.model';
import { Release } from 'src/release/models/release.model';
import { ReleaseService } from 'src/release/release.service';
import { AlbumService } from 'src/album/album.service';
import { TrackType } from 'src/track/models/track-type';
import { AlbumType } from 'src/album/models/album-type';

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
		let song: Song = await this.songService.findOrCreateSong(metadata.artist ?? metadata.albumArtist!, metadata.name!);
		Logger.debug(song.toJSON());
		let release: Release = await this.releaseService.findOrCreateRelease(metadata.album!, metadata.album!, metadata.albumArtist ?? metadata.artist ?? undefined);
		Logger.debug(release.toJSON());
		let track: Track = Track.build({
			release: release,
			song: song,
			displayName: metadata.name!,
			master: song.instances.length == 0,
			discIndex: metadata.discIndex,
			trackIndex: metadata.index,
			type: metadata.type!,
			bitrate: metadata.bitrate ?? 0,
			ripSource: undefined,
			duration: metadata.duration ?? 0,
		});
		release.releaseDate = metadata.releaseDate;
		if ((release.releaseDate !== undefined &&
			release.album.releaseDate !== undefined &&
			release.album.releaseDate > release.releaseDate) || 
			release.releaseDate !== undefined)
			release.album.releaseDate = release.releaseDate;
		release.album.type = metadata.compilation ? AlbumType.Compilation : release.album.type;
		track.release.album = await this.albumService.saveAlbum(release.album);
		track.release = await this.releaseService.saveRelease(release);
		return await this.trackService.saveTrack(track);
	}

	/**
	 * Parses a file's metadata from its embedded data and its path
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadata(filePath: string): Promise<Metadata> {
		let fileMetadata: Metadata = await this.parseMetadataFromFile(filePath);
		
		if (this.settingsService.usePathAsMetadataSource) {
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
			throw new FileNotFoundException(filePath);
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
		} catch (e) {
			Logger.log(e.message);
			throw new FileParsingException(filePath);
		}
	}

	/**
	 * Parses a File path and 
	 * @param filePath a path (full or not) to a file
	 * @returns returns Metadata object with values from the capture groups of the regex in settings file
	 */
	private parseMetadataFromPath(filePath: string): Metadata {
		try {
			let matchingRegex: RegExpMatchArray = this.settingsService.trackRegexes
				.map((regex) => filePath.match(regex))
				.find((regexMatch) => regexMatch != null)!;
			let groups = matchingRegex.groups!;
			return {
				albumArtist: groups['Artist'] ?? undefined,
				release: groups['Album'] ?? undefined,
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
			compilation: rawMetadata.common.compilation,
			artist: rawMetadata.common.artist,
			albumArtist: rawMetadata.common.albumartist,
			album: rawMetadata.common.album,
			release: rawMetadata.common.album,
			name: rawMetadata.common.title,
			index: rawMetadata.common.track.no ?? undefined,
			discIndex: rawMetadata.common.disk.no ?? undefined,
			bitrate: rawMetadata.format.bitrate ,
			duration: rawMetadata.format.duration,
			releaseDate: rawMetadata.common.date ? new Date(rawMetadata.common.date) : undefined,
			type: isVideo ? TrackType.Video : TrackType.Audio
		};
	}

}
