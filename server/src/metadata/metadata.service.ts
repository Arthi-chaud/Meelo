import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import type Metadata from './models/metadata';
import mm, { type IAudioMetadata } from 'music-metadata';
import { FileDoesNotExistException, FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
import { FileParsingException, PathParsingException } from './metadata.exceptions';
import SettingsService from 'src/settings/settings.service';
import TrackService from 'src/track/track.service';
import SongService from 'src/song/song.service';
import { AlbumType, TrackType } from '@prisma/client';
import ReleaseService from 'src/release/release.service';
import AlbumService from 'src/album/album.service';
import ArtistService from 'src/artist/artist.service';
import type TrackQueryParameters from 'src/track/models/track.query-parameters';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import GenreService from 'src/genre/genre.service';
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import FileService from 'src/file/file.service';
import { File, Track } from 'src/prisma/models';
import FfmpegService from 'src/ffmpeg/ffmpeg.service';

@Injectable()
export default class MetadataService {
	constructor(
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private fileManagerService: FileManagerService,
		private ffmpegService: FfmpegService,
	) {}

	/**
	 * Pushed the metadata to the database, calling services
	 * @param metadata the metadata instance to push
	 * @param file the file to register the metadata under, it must be already registered
	 */
	async registerMetadata(metadata : Metadata, file: File): Promise<Track> {
		const genres = metadata.genres ? await Promise.all(
			metadata.genres.map((genre) => this.genreService.getOrCreate({ name: genre }))
		) : [];
		const albumArtist = !metadata.compilation
			? await this.artistService.getOrCreate(
				{ name: metadata.albumArtist ?? metadata.artist! }
			)
			: undefined;
		const songArtist = await this.artistService.getOrCreate(
			{ name: metadata.artist ?? metadata.albumArtist! }
		);
		const song = await this.songService.getOrCreate({
			name: this.removeTrackExtension(metadata.name!),
			artist: { id: songArtist.id },
			genres: genres.map((genre) => ({ id: genre.id }))
		}, {
			tracks: true, genres: true
		});

		await this.songService.update(
			{ genres: song.genres.concat(genres).map((genre) => ({ id: genre.id })) },
			{ id: song.id }
		);
		const album = await this.albumService.getOrCreate({
			name: this.removeReleaseExtension(metadata.album ?? metadata.release!),
			artist: albumArtist ? { id: albumArtist?.id } : undefined
		}, { releases: true });
		const release = await this.releaseService.getOrCreate({
			name: metadata.release ?? metadata.album!,
			releaseDate: metadata.releaseDate,
			album: { id: album.id }
		}, { album: true });
		const track: TrackQueryParameters.CreateInput = {
			name: metadata.name!,
			discIndex: metadata.discIndex ?? null,
			trackIndex: metadata.index ?? null,
			type: metadata.type!,
			bitrate: Math.floor(metadata.bitrate ?? 0),
			ripSource: null,
			duration: Math.floor(metadata.duration ?? 0),
			sourceFile: { id: file.id },
			release: { id: release.id },
			song: { id: song.id },
		};

		if (albumArtist === undefined && release.album.type == AlbumType.StudioRecording) {
			await this.albumService.update(
				{ type: AlbumType.Compilation },
				{ id: release.albumId }
			);
		}
		if (!release.releaseDate ||
		metadata.releaseDate && release.releaseDate < metadata.releaseDate) {
			await this.releaseService.update(
				{ releaseDate: metadata.releaseDate }, { id: release.id }
			);
		}
		return this.trackService.create(track);
	}

	/**
	 * Parses a file's metadata from its embedded data and its path
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadata(filePath: string): Promise<Metadata> {
		const fileMetadata: Metadata = await this.parseMetadataFromFile(filePath);
		const pathMetadata: Metadata = this.parseMetadataFromPath(filePath);
		const settings = this.settingsService.settingsValues;

		pathMetadata.duration = fileMetadata.duration;
		pathMetadata.type = fileMetadata.type;
		pathMetadata.bitrate = fileMetadata.bitrate;
		if (settings.metadata.order == "only") {
			if (settings.metadata.source == "path") {
				return pathMetadata;
			}
			return fileMetadata;
		}
		if (settings.metadata.source == "path") {
			return this.mergeMetadata(pathMetadata, fileMetadata);
		}
		return this.mergeMetadata(fileMetadata, pathMetadata);
	}

	/**
	 * Parses a file's metadata from its embedded data
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadataFromFile(filePath: string): Promise<Metadata> {
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
			const matchingRegex: RegExpMatchArray = this.settingsService.settingsValues.trackRegex
				.map((regex) => filePath.match(regex))
				.find((regexMatch) => regexMatch != null)!;
			const groups = matchingRegex.groups!;
			const isCompilation = groups['AlbumArtist']?.toLocaleLowerCase() === compilationAlbumArtistKeyword ||
			groups['Artist']?.toLocaleLowerCase() === compilationAlbumArtistKeyword;

			return {
				compilation: isCompilation,
				albumArtist: isCompilation ? undefined : groups['AlbumArtist'] ?? undefined,
				artist: groups['Artist'] ?? undefined,
				release: groups['Release'] ?? undefined,
				album: groups['Album'] ?? undefined,
				releaseDate: groups['Year'] ? new Date(groups['Year']) : undefined,
				discIndex: groups['Disc'] ? parseInt(groups['Disc']) : undefined,
				index: groups['Index'] ? parseInt(groups['Index']) : undefined,
				name: groups['Track'],
				genres: groups['Genre'] ? [groups['Genre']] : undefined
			};
		} catch {
			throw new PathParsingException(filePath);
		}
	}

	private buildMetadataFromRaw(rawMetadata: IAudioMetadata): Metadata {
		const isVideo: boolean = rawMetadata.format.trackInfo.length > 1;

		return {
			genres: rawMetadata.common.genre,
			compilation: rawMetadata.common.compilation ?? false,
			artist: rawMetadata.common.artist,
			albumArtist: rawMetadata.common.compilation
				? undefined
				: rawMetadata.common.albumartist,
			album: rawMetadata.common.album,
			release: rawMetadata.common.album,
			name: rawMetadata.common.title,
			index: rawMetadata.common.track.no ?? undefined,
			discIndex: rawMetadata.common.disk.no ?? undefined,
			bitrate: rawMetadata.format.bitrate
				? Math.floor(rawMetadata.format.bitrate / 1000)
				: undefined,
			duration: rawMetadata.format.duration
				? Math.floor(rawMetadata.format.duration)
				: undefined,
			releaseDate: rawMetadata.common.date ? new Date(rawMetadata.common.date) : undefined,
			type: isVideo ? TrackType.Video : TrackType.Audio
		};
	}

	/**
	 * Merge two metadata objects
	 * @param metadata1 the 'base' metadata. Undefined fields will be overriden by `metadata2`'s
	 * @param metadata2 the second metadata object
	 * @returns the merged metadata
	 */
	private mergeMetadata(metadata1: Metadata, metadata2: Metadata): Metadata {
		return <Metadata>{
			genres: metadata1.genres ?? metadata2.genres,
			compilation: metadata1.compilation ?? metadata2.compilation,
			artist: metadata1.artist ?? metadata2.artist,
			albumArtist: metadata1.albumArtist ?? metadata2.albumArtist,
			album: metadata1.album ?? metadata2.album,
			release: metadata1.release ?? metadata2.release,
			name: metadata1.name ?? metadata2.name,
			releaseDate: metadata1.releaseDate ?? metadata2.releaseDate,
			index: metadata1.index ?? metadata2.index,
			discIndex: metadata1.discIndex ?? metadata2.discIndex,
			bitrate: metadata1.bitrate ?? metadata2.bitrate,
			duration: metadata1.duration ?? metadata2.duration,
			type: metadata1.type ?? metadata2.type,
		};
	}

	/**
	 * Apply metadata on a file found in the database
	 */
	async applyMetadataOnFile(where: FileQueryParameters.WhereInput): Promise<void> {
		const file = await this.fileService.get(where, { library: true });
		const track = await this.trackService.get({ sourceFile: where });
		const song = await this.songService.get({ id: track.songId }, { genres: true });
		const release = await this.releaseService.get(
			{ id: track.releaseId }, { album: true }
		);
		const album = await this.albumService.get(
			{ id: release.albumId }, { artist: true }
		);
		const artist = await this.artistService.get({ id: song.artistId });
		const libraryPath = this.fileManagerService.getLibraryFullPath(file.library);
		const fullFilePath = `${libraryPath}/${file.path}`;
		const metadata: Metadata = {
			compilation: false,
			artist: artist.name,
			albumArtist: album.artist?.name,
			album: album.name,
			release: release.name,
			name: song.name,
			releaseDate: release.releaseDate ?? undefined,
			index: track.trackIndex ?? undefined,
			discIndex: track.discIndex ?? undefined,
			genres: song.genres!.map((genre) => genre.name)
		};

		this.ffmpegService.applyMetadata(fullFilePath, metadata);
	}

	/**
	 * Removes an extension from a release's name
	 * For example, if the release Name is 'My Album (Deluxe Edition)', the parent
	 * album name would be 'My Album'
	 */
	removeReleaseExtension(releaseName: string): string {
		const extensionKeywords = [
			'Edition',
			'Version',
			'Reissue',
			'Deluxe',
			'Standard',
			'Edited',
			'Explicit',
			'Remaster',
			'Remastered'
		];

		return this.removeExtensions(releaseName, extensionKeywords);
	}

	/**
	 * Removes an extension from a track's name
	 * For example, if the release Name is 'My Song (Music Video)', the parent
	 * song name would be 'My Song'
	 * It will remove the video and the remaster extension
	 */
	removeTrackExtension(trackName: string): string {
		const extensionKeywords = [
			'Video',
			'Remaster',
			'Remastered',
			'Album Version'
		];

		return this.removeExtensions(trackName, extensionKeywords);
	}

	/**
	 * Removes the extensions in a string found by 'extractExtensions'
	 * @param source the string t ofind the extensions in
	 * @param extensions the extensions to find
	 * @returns the cleaned source
	 */
	private removeExtensions(source: string, extensions: string[]): string {
		let output = source;

		this.extractExtensions(source, extensions)
			.forEach((extension) => output = output.replace(extension, '').trim());
		return output;
	}

	/**
	 * From an array of extension keyword, extract groups from the source
	 * example: 'My Album (Deluxe) [Remaster]' => ['(Deluxe)', '[Remaster]']
	 * @param source the string to extract the extensions from
	 * @param extensions the aray of extensions to find
	 */
	private extractExtensions(source: string, extensions: string[]): string[] {
		let groupsFound: string[] = [];
		const extensionDelimiters = [
			['(', ')'],
			['{', '}'],
			['[', ']']
		];
		const extensionsGroup = extensions.map((ext) => `(${ext})`).join('|');

		for (const delimiter of extensionDelimiters) {
			const regExp = new RegExp(`\\s+(?<extension>\\${delimiter[0]}.*(${extensionsGroup}).*\\${delimiter[1]})\\s*`, 'i');
			const match = regExp.exec(source);

			if (match) {
				groupsFound = groupsFound.concat(match[1]);
			}
		}
		return groupsFound;
	}
}
