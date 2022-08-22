import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import type Metadata from './models/metadata';
import mm, { type IAudioMetadata } from 'music-metadata';
import { FileDoesNotExistException, FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
import { FileParsingException, PathParsingException } from './metadata.exceptions';
import SettingsService from 'src/settings/settings.service';
import TrackService from 'src/track/track.service';
import SongService from 'src/song/song.service';
import { TrackType, AlbumType, File, Track} from '@prisma/client';
import ReleaseService from 'src/release/release.service';
import AlbumService from 'src/album/album.service';
import ArtistService from 'src/artist/artist.service';
import type TrackQueryParameters from 'src/track/models/track.query-parameters';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import GenreService from 'src/genre/genre.service';
import Ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import FileService from 'src/file/file.service';
@Injectable()
export default class MetadataService {
	public readonly metadataFolderPath;
	constructor(
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => SongService))
		private releaseService: ReleaseService,
		private settingsService: SettingsService,
		private genreService: GenreService,
		private fileService: FileService,
		private fileManagerService: FileManagerService) {
		this.metadataFolderPath = `${this.fileManagerService.configFolderPath}/metadata`;
	}

	/**
	 * Pushed the metadata to the database, calling services
	 * @param metadata the metadata instance to push
	 * @param file the file to register the metadata under, it must be already registered
	 */
	async registerMetadata(metadata : Metadata, file: File): Promise<Track> {
		let genres = metadata.genres ? await Promise.all(
			metadata.genres.map(async (genre) => await this.genreService.getOrCreate({ name: genre }))
		) : [];
		let albumArtist = metadata.albumArtist ? await this.artistService.getOrCreate({ name: metadata.albumArtist }) : undefined;
		let songArtist = await this.artistService.getOrCreate({ name: metadata.artist ?? metadata.albumArtist! });
		let song = await this.songService.getOrCreate(
			{ name: this.removeTrackVideoExtension(metadata.name!), artist: { id: songArtist.id }, genres: genres.map((genre) => ({ id: genre.id }))},
			{ tracks: true, genres: true });
		await this.songService.update(
			{ genres: song.genres.concat(genres).map((genre) => ({ id: genre.id }))},
			{ byId: { id: song.id } }
		);
		let album = await this.albumService.getOrCreate({
			name: this.removeReleaseExtension(metadata.album ?? metadata.release!),
			artist: albumArtist ? { id: albumArtist?.id} : undefined
		}, { releases: true });
		let release = await this.releaseService.getOrCreate({
			title: metadata.release ?? metadata.album!,
			master: album.releases.length == 0,
			releaseDate: metadata.releaseDate,
			album: { byId: { id: album.id } }
		}, { album: true });
		let track: TrackQueryParameters.CreateInput = {
			displayName: metadata.name!,
			master: song.tracks.length == 0,
			discIndex: metadata.discIndex ?? null,
			trackIndex: metadata.index ?? null,
			type: metadata.type!,
			bitrate: Math.floor(metadata.bitrate ?? 0),
			ripSource: null,
			duration: Math.floor(metadata.duration ?? 0),
			sourceFile: { id: file.id },
			release: { byId: { id: release.id } },
			song: { byId: { id: song.id } },
		};
		if ((release.releaseDate !== null &&
			release.album.releaseDate !== null &&
			release.album.releaseDate > release.releaseDate) || 
			release.releaseDate !== undefined)
			release.album.releaseDate = release.releaseDate;
		release.album.type = metadata.compilation ? AlbumType.Compilation : release.album.type;
		await this.albumService.update({ ...release.album }, { byId: { id: release.albumId }});
		release.releaseDate = metadata.releaseDate ?? null;
		await this.releaseService.update({ releaseDate: release.releaseDate ?? undefined }, { byId: { id: release.id } });
		return this.trackService.create(track);
	}

	/**
	 * Parses a file's metadata from its embedded data and its path
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadata(filePath: string): Promise<Metadata> {
		let fileMetadata: Metadata = await this.parseMetadataFromFile(filePath);
		let pathMetadata: Metadata = this.parseMetadataFromPath(filePath);
		const settings = this.settingsService.settingsValues;

		if (settings.metadata.order == "only") {
			if (settings.metadata.source == "path")
				return pathMetadata;
			return fileMetadata;
		}
		if (settings.metadata.source == "path")
			return this.mergeMetadata(pathMetadata, fileMetadata);
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
			let matchingRegex: RegExpMatchArray = this.settingsService.settingsValues.trackRegex
				.map((regex) => filePath.match(regex))
				.find((regexMatch) => regexMatch != null)!;
			let groups = matchingRegex.groups!;
			const isCompilation = groups['AlbumArtist']?.toLocaleLowerCase() === compilationAlbumArtistKeyword ||
			groups['Artist']?.toLocaleLowerCase() === compilationAlbumArtistKeyword;
			return {
				compilation: isCompilation,
				albumArtist: isCompilation ? undefined : (groups['AlbumArtist'] ?? undefined),
				artist: groups['Artist'] ?? undefined,
				release: groups['Release'] ?? undefined,
				album: groups['Album'] ?? undefined,
				releaseDate: groups['Year'] ? new Date(groups['Year']) : undefined,
				discIndex: groups['Disc'] ? parseInt(groups['Disc']) : undefined,
				index: groups['Index'] ? parseInt(groups['Index']) : undefined,
				name: groups['Track'],
				genres: groups['Genre'] ? [groups['Genre']] : undefined
			}
		} catch {
			throw new PathParsingException(filePath);
		}
	}

	private buildMetadataFromRaw(rawMetadata: IAudioMetadata): Metadata {
		let isVideo: boolean = rawMetadata.format.trackInfo.length != 1;
		return {
			genres: rawMetadata.common.genre,
			compilation: rawMetadata.common.compilation ?? false,
			artist: rawMetadata.common.artist,
			albumArtist: rawMetadata.common.compilation ? undefined : rawMetadata.common.albumartist,
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
	 * Merge two metadata objects
	 * @param metadata1 the 'base' metadata. Undefined fields will be overriden by `metadata2`'s
	 * @param metadata2 the second metadata object
	 * @returns the merged metadata
	 */
	private mergeMetadata(metadata1: Metadata, metadata2: Metadata): Metadata {
		return <Metadata>{
			genres: metadata1.genres ?? metadata2.compilation,
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
		const song = await this.songService.get({ byId: { id: track.songId } }, { genres: true });
		const release = await this.releaseService.get({ byId: { id: track.releaseId }}, { album: true });
		const album = await this.albumService.get({ byId: { id: release.albumId } }, { artist: true });
		const artist = await this.artistService.get({ id: song.artistId });
		const libraryPath = this.fileManagerService.getLibraryFullPath(file.library);
		const fullFilePath = `${libraryPath}/${file.path}`;
		const metadata: Metadata = {
			compilation: false,
			artist: artist.name,
			albumArtist: album.artist?.name,
			album: album.name,
			release: release.title,
			name: song.name,
			releaseDate: release.releaseDate ?? undefined,
			index: track.trackIndex ?? undefined,
			discIndex: track.discIndex ?? undefined,
			genres: song.genres!.map((genre) => genre.name)
		}
		this.applyMetadata(fullFilePath, metadata);
	}

	/**
	 * Apply metadata to source file
	 * @param filePath the full path of the file to apply the metadata to
	 * @param metadata the metadata to apply
	 */
	applyMetadata(filePath: string, metadata: Metadata) {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		const tmpOutput = `${filePath}-temp`;
		const ffmpegTags: [string, string | undefined | null][] = [
			["artist", metadata.artist],
			["album_artist", metadata.albumArtist],
			["album", metadata.release],
			["title", metadata.name],
			["date", metadata.releaseDate?.getFullYear().toString()],
			["track", metadata.index?.toString()],
			["disc", metadata.discIndex?.toString()],
			["genre", metadata.genres?.at(0)],
		]
		try {
			Ffmpeg(filePath)
				.inputOptions([
					"-map 0",
					"-map_metadata 0",
					"-c copy",
					...ffmpegTags.map(
						([tag, value]) => `-metadata '${tag}'='${value?.toString()}'`
					)
				])
				.output(tmpOutput)
				.on('end', () => Logger.error(`Applying metadata on file '${filePath}' successed`))
				.save(tmpOutput);
			fs.rename(tmpOutput, filePath, () => {});
		} catch {
			Logger.error(`Applying metadata on file '${filePath}' failed`);
		}
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

	/**
	 * Removes an extension from a track's name
	 * For example, if the release Name is 'My Song (Music Video)', the parent
	 * song name would be 'My Song'
	 */
	removeTrackVideoExtension(trackName: string): string {
		return trackName.replace(/\s*\(.*(Video|video).*\)/, "").trim();
	}

}
