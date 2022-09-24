import { forwardRef, Inject, Injectable, Logger, OnModuleInit, StreamableFile } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import MetadataService from 'src/metadata/metadata.service';
import type { Release, Track } from '@prisma/client';
import ReleaseService from 'src/release/release.service';
import Slug from 'src/slug/slug';
import { CantDownloadIllustrationException, IllustrationNotExtracted, NoIllustrationException } from './illustration.exceptions';
import mm, { IPicture, type IAudioMetadata } from 'music-metadata';
import * as fs from 'fs';
import { FileParsingException } from 'src/metadata/metadata.exceptions';
import * as dir from 'path';
import type { IllustrationPath } from './models/illustration-path.model';
import Jimp from 'jimp';
import AlbumService from 'src/album/album.service';
import { FileDoesNotExistException } from 'src/file-manager/file-manager.exceptions';
import { ModuleRef } from '@nestjs/core';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import Ffmpeg from 'fluent-ffmpeg';
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import TrackService from 'src/track/track.service';
import FileService from 'src/file/file.service';
import path from 'path';

type IllustrationExtractStatus = 'extracted' | 'error' | 'already-extracted' | 'different-illustration';

@Injectable()
export default class IllustrationService implements OnModuleInit {
	public illustrationFolderPath: string;
	private metadataService: MetadataService;
	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private fileService: FileService,
		private fileManagerService: FileManagerService,
		private moduleRef: ModuleRef
	) {	}

	onModuleInit() {
		this.metadataService = this.moduleRef.get(MetadataService, { strict: false });
		this.illustrationFolderPath = this.metadataService.metadataFolderPath;
	}

	buildCompilationIllustrationFolderPath(): string {
		return `${this.illustrationFolderPath}/${compilationAlbumArtistKeyword}`;
	}
	/**
	 * From an artist's slug, build its illustrations folder path which holds sub-directories for related albums
	 * @param artistSlug The slug of an artist
	 */
	buildArtistIllustrationFolderPath(artistSlug?: Slug): string {
		if (artistSlug == undefined)
			return this.buildCompilationIllustrationFolderPath();
		const artistMetadataFolder: string = `${this.illustrationFolderPath}/${artistSlug}`;
		return artistMetadataFolder;
	}
	/**
	 * From an artist's slug and an album's slug, build its illustrations folder path which holds sub-directories for related albums
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album from the artist
	 */
	buildAlbumIllustrationFolderPath(albumSlug: Slug, artistSlug?: Slug): string {
		const artistMetadataFolder: string = this.buildArtistIllustrationFolderPath(artistSlug);
		const albumMetadataFolder: string = `${artistMetadataFolder}/${albumSlug}`;
		return albumMetadataFolder;
	}

	/**
	 * From an artist's slug, an album's slug and a release's slug, builds the later's illustrations folder
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album from the artist
	 * @param releaseSlug The slug of a release of the album
	 */
	buildReleaseIllustrationFolderPath(albumSlug: Slug, releaseSlug: Slug, artistSlug?: Slug): string {
		const albumMetadataFolder: string = this.buildAlbumIllustrationFolderPath(albumSlug, artistSlug);
		const releaseMetadataFolder: string = `${albumMetadataFolder}/${releaseSlug.toString()}`;
		return releaseMetadataFolder;
	}

	/**
	 * From an artist's slug, return its illustration ('Profile picture') path
	 * @param artistSlug The slug of an artist
	 */
	buildArtistIllustrationPath(artistSlug?: Slug): IllustrationPath {
		const artistMetadataFolder: string = this.buildArtistIllustrationFolderPath(artistSlug);
		const artistIllustrationPath = `${artistMetadataFolder}/cover.jpg`;
		return artistIllustrationPath;
	}
	/**
	 * From an artist and an album's slug, return its master release's illustration (cover) path
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album
	 */
	async buildMasterReleaseIllustrationPath(albumSlug: Slug, artistSlug?: Slug): Promise<IllustrationPath> {
		const masterRelease: Release = await this.releaseService.getMasterRelease({
			bySlug: { slug: albumSlug, artist: artistSlug ? { slug: artistSlug } : undefined }
		});
		return this.buildReleaseIllustrationPath(albumSlug, new Slug(masterRelease.slug), artistSlug);
	}
	/**
	 * From an artist, an album, and a release's slug, return the release's illustration (cover) path
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album
	 * @param releaseSlug The slug of an release
	 */
	buildReleaseIllustrationPath(albumSlug: Slug, releaseSlug: Slug, artistSlug?: Slug): IllustrationPath {
		const releaseIllustrationFolder: string = this.buildReleaseIllustrationFolderPath(albumSlug, releaseSlug, artistSlug);
		const releaseIllstrationPath: string = `${releaseIllustrationFolder}/cover.jpg`;
		return releaseIllstrationPath;
	}

	/**
	 * Builds the illustration path of the track
	 */
	buildTrackIllustrationPath(albumSlug: Slug, releaseSlug: Slug, artistSlug?: Slug, discIndex?: number, trackIndex?: number): IllustrationPath {
		const releaseIllustrationFolder = this.buildReleaseIllustrationFolderPath(
			albumSlug,
			releaseSlug,
			artistSlug
		);
		return `${releaseIllustrationFolder}/${discIndex ? `disc-${discIndex}-` : ''}track-${trackIndex ?? 0 }/cover.jpg` 
	}

	/**
	 * @param illustrationPath full path to an illustration 
	 * @returns true if the illustration file exists, false otherwire
	 */
	illustrationExists(illustrationPath: IllustrationPath) {
		return this.fileManagerService.fileExists(illustrationPath);
	}

	/**
	 * @param illustrationPath full path to an illustration
	 */
	deleteIllustration(illustrationPath: IllustrationPath) {
		return this.fileManagerService.deleteFile(illustrationPath);
	}

	/**
	 * @param illustrationFolderPath full path to an illustration folder
	 */
	deleteIllustrationFolder(illustrationFolderPath: IllustrationPath) {
		return this.fileManagerService.deleteFolder(illustrationFolderPath);
	}

	reassignAlbumIllustrationFolder(albumSlug: Slug, oldArtistSlug?: Slug, newArtistSlug?: Slug) {
		const previousPath = this.buildAlbumIllustrationFolderPath(albumSlug, oldArtistSlug);
		const newPath = this.buildAlbumIllustrationFolderPath(albumSlug, newArtistSlug);
		if (this.fileManagerService.folderExists(previousPath))
			fs.renameSync(previousPath, newPath);
	}

	reassignReleaseIllustrationFolder(
		releaseSlug: Slug, oldAlbumSlug: Slug, newAlbumSlug: Slug, oldArtistSlug?: Slug, newArtistSlug?: Slug
	) {
		const previousPath = this.buildReleaseIllustrationFolderPath(oldAlbumSlug, releaseSlug, oldArtistSlug);
		const newPath = this.buildReleaseIllustrationFolderPath(newAlbumSlug, releaseSlug, newArtistSlug);
		if (this.fileManagerService.folderExists(previousPath))
			fs.renameSync(previousPath, newPath);
	}

	/**
	 * Extracts the embedded illustration in a track file
	 * If no illustration is embedded, returns null
	 * If the embedded illustration is the same as the release's, nothing is done and return null
	 * If there is no release illustration, extracts the track's illustration and return its path
	 * Otherwise, if there is a release illustration, but the track's differs from it
	 * extracts the track's illustration as a track-specific illustration, and return its path
	 * @param track the track to extract the illustration from
	 */
	async extractTrackIllustration(track: Track, fullTrackPath: string): Promise<IllustrationPath | null> {
		Logger.log(`Extracting illustration from track '${track.name}'`);
		let release: Release = await this.releaseService.get({ byId: { id: track.releaseId } });
		let album = await this.albumService.get(
			{ byId: { id: release.albumId }},
			{ artist: true }
		)
		const releaseSlug = new Slug(release.slug);
		const artistSlug = album.artist ? new Slug(album.artist.slug) : undefined;
		const albumSlug = new Slug(album.slug);
		const releaseIllustrationPath = this.buildReleaseIllustrationPath(
			albumSlug,
			releaseSlug,
			artistSlug
		);
		const trackIllustrationPath = this.buildTrackIllustrationPath(
			albumSlug,
			releaseSlug,
			artistSlug,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		const illustration = await this.extractIllustrationFromFile(fullTrackPath);
		if (illustration == null) {
			Logger.warn("No illustration to extract");
			return null;
		}
		const illustrationBytes = (await (await Jimp.read(illustration.data)).getBufferAsync(Jimp.MIME_JPEG));
		for (const path of [releaseIllustrationPath, trackIllustrationPath]) {
			const illustrationExtractionStatus = await this.saveIllustrationWithStatus(illustrationBytes, path);
			if (illustrationExtractionStatus === 'error')
				throw new IllustrationNotExtracted('Illustration extraction failed');
			if (illustrationExtractionStatus === 'already-extracted') {
				Logger.log("Illustration was previously extracted");
				return path;
			}
			if (illustrationExtractionStatus === 'extracted') {
				Logger.log("Illustration extracted successfully");
				return path;
			}
			if (illustrationExtractionStatus === 'different-illustration') {
				continue;
			}
		}
		Logger.warn("No illustration extracted");
		return null;
	}

	private async saveIllustrationWithStatus(illustrationBuffer: Buffer, outputPath: string): Promise<IllustrationExtractStatus> {
		if (this.fileManagerService.fileExists(outputPath)) {
			if (this.fileManagerService.getFileContent(outputPath) == illustrationBuffer.toString())
				return 'already-extracted';
			return 'different-illustration';
		}
		try {
			this.saveIllustration(illustrationBuffer, outputPath);
			return 'extracted';
		} catch {
			return 'error';
		}
	}

	/**
	 * Extracts the embedded illustration of a file
	 * @param filePath the full path to the source file to scrap
	 */
	private async extractIllustrationFromFile(filePath: string): Promise<IPicture | null> {
		let rawMetadata: IAudioMetadata;
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		try {
			rawMetadata = await mm.parseFile(filePath, {
				skipCovers: false,
			});
		} catch {
			throw new FileParsingException(filePath);
		}
		return mm.selectCover(rawMetadata.common.picture);
	}

	/**
	 * Apply the illustration of a track on its source track
	 */
	async applyIllustrationOnFile(where: FileQueryParameters.WhereInput): Promise<void> {
		const file = await this.fileService.get(where, { library: true, track: true });
		const track: Track = file.track!;
		const libraryPath = this.fileManagerService.getLibraryFullPath(file.library);
		const fullFilePath = `${libraryPath}/${file.path}`;
		const trackIllustrationPath = await this.trackService.buildIllustrationPath({ id: track.id });
		if (this.illustrationExists(trackIllustrationPath)) {
			this.applyIllustration(trackIllustrationPath, fullFilePath);
			return;
		}
		const releaseIllustrationPath = await this.releaseService.buildIllustrationPath({ byId: { id: track.releaseId } });
		if (this.illustrationExists(trackIllustrationPath)) {
			this.applyIllustration(releaseIllustrationPath, fullFilePath);
		} else {
			Logger.warn(`No illustration was applied to ${fullFilePath}`)
		}
			
	}

	/**
	 * 
	 * Apply illustration to file
	 * @param illustrationPath the full path of the illustration to apply
	 * @param filePath the full path of the file to apply the illustration to
	 */
	applyIllustration(illustrationPath: string, filePath: string) {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		if (!this.fileManagerService.fileExists(illustrationPath)) {
			throw new FileDoesNotExistException(illustrationPath);
		}
		try {
			Ffmpeg(filePath)
				.addInput(illustrationPath)
				.inputOptions([
				"-map 0:V",
				"-map 0:a",
				"-map 0:s",
				"-map 1",
				"-c copy",
				"-disposition:0 attached_pic"
			]);
		} catch {
			Logger.error(`Applying illustration to '${filePath}' failed`);
		}
	}

	/**
	 * Takes a screenshot of a video file's content
	 * @param videoPath the full path of a video file
	 * @param outPath the path to the output illustration
	 */
	takeVideoScreenshot(videoPath: string, outPath: string) {
		if (!this.fileManagerService.fileExists(videoPath)) {
			throw new FileDoesNotExistException(videoPath);
		}
		fs.mkdir(path.dirname(outPath), { recursive: true }, () => {});
		Ffmpeg(videoPath).thumbnail({
			count: 1,
			filename: path.basename(outPath),
			folder: path.dirname(outPath)
		}).on('error', () => {
			Logger.error(`Taking a screenshot of '${path.basename(videoPath)}' failed`);
		}).on('end', () => {
			Logger.log(`Taking a screenshot of '${path.basename(videoPath)}' succeded`);
		});
	}

	/**
	 * Downloads an illustration from a URL, and stores it in the illustration file system
	 * using the provided slug
	 * @param illustrationURL the full path to the source file to scrap
	 * @param outPath path to the file to save the illustration as
	 */
	async downloadIllustration(illustrationURL: string, outPath: IllustrationPath) {
		try {
			let image = await Jimp.read(illustrationURL);
			fs.mkdir(dir.dirname(outPath), { recursive: true }, function (_err) {});
			image.write(outPath);
		} catch {
			throw new CantDownloadIllustrationException(illustrationURL);
		}
	}

	/**
	 * Saves an illustration in the illustration file system
	 * @param fileContent raw binary content of the file to save
	 * @param outPath path and name of the file to save the fileContent as
	 */
	private saveIllustration(fileContent: Buffer, outPath: IllustrationPath) {
		fs.mkdirSync(dir.dirname(outPath), { recursive: true });
		fs.writeFileSync(outPath, fileContent);
	}

	/**
	 * 
	 * @param sourceFilePath the file path to the illustration to stream
	 * @param as the name of the send tile, without extension
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the illustration
	 */
	streamIllustration(sourceFilePath: string, as: string, res: any): StreamableFile {
		if (this.fileManagerService.fileExists(sourceFilePath) == false)
			throw new NoIllustrationException("Illustration file not found");
		const illustration = fs.createReadStream(sourceFilePath);
		res.set({
			'Content-Disposition': `attachment; filename="${as}.jpg"`,
		});
		return new StreamableFile(illustration);
	}


	/**
	 * Builds the URL to the artist's illustration.
	 * If there is no illustration, it will return null
	 */
	getArtistIllustrationLink(artistSlug: Slug): string | null {
		if (this.illustrationExists(this.buildArtistIllustrationPath(artistSlug)))
			return `/illustrations/artists/${artistSlug.toString()}`;
		return null;
	}

	/**
	 * Builds the URL to the release's illustration.
	 * If there is no illustration, it will return null
	 */
	async getReleaseIllustrationLink(releaseId: number): Promise<string | null> {
		if (this.illustrationExists(await this.releaseService.buildIllustrationPath({ byId: { id: releaseId } }))) {
			return `/illustrations/releases/${releaseId}`;
		}
		return null;
	}

	/**
	 * Builds the URL to the album's illustration.
	 * If there is no illustration, it will return null
	 */
	 async getAlbumIllustrationLink(albumId: number): Promise<string | null> {
		try {
			const masterRelease = await this.releaseService.getMasterRelease({ byId: { id: albumId } });
			return await this.getReleaseIllustrationLink(masterRelease.id)
		} catch {
			return null;
		}
	}
}
