import sharp from 'sharp';
import {
	Inject, Injectable, StreamableFile, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import type { Release, Track } from 'src/prisma/models';
import ReleaseService from 'src/release/release.service';
import Slug from 'src/slug/slug';
import escapeRegex from 'src/utils/escape-regex';
import {
	CantDownloadIllustrationException, IllustrationNotExtracted, NoIllustrationException
} from './illustration.exceptions';
import mm, { type IAudioMetadata } from 'music-metadata';
// eslint-disable-next-line no-restricted-imports
import * as fs from 'fs';
import { FileParsingException } from 'src/metadata/metadata.exceptions';
import * as dir from 'path';
import type { IllustrationPath } from './models/illustration-path.model';
import Jimp from 'jimp';
import AlbumService from 'src/album/album.service';
import { FileDoesNotExistException } from 'src/file-manager/file-manager.exceptions';
import { Readable } from 'stream';
import type { IllustrationDimensionsDto } from './models/illustration-dimensions.dto';
import SettingsService from 'src/settings/settings.service';
import glob from 'glob';
import Logger from 'src/logger/logger';
import TrackIllustrationService from 'src/track/track-illustration.service';
import { basename } from 'path';
import ReleaseIllustrationService from 'src/release/release-illustration.service';
import * as Blurhash from 'blurhash';
import getColors from 'get-image-colors';

type IllustrationExtractStatus = 'extracted' | 'error' | 'already-extracted' | 'different-illustration';

/**
 * A service to handle illustration files (downloads, extractions, conversion & streaming)
 * For anything related to Illustration models, see `Illustration Repository`
 */
@Injectable()
export default class IllustrationService {
	private readonly logger = new Logger(IllustrationService.name);

	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => ReleaseIllustrationService))
		private releaseIllustrationService: ReleaseIllustrationService,
		private fileManagerService: FileManagerService,
		private trackIllustrationService: TrackIllustrationService
	) {}

	/**
	 * Regular Expression to match source cover files
	 */
	public static SOURCE_ILLUSTRATON_FILE = '[Cc]over.*';

	/**
	 * Extracts the embedded illustration in a track file
	 * If no illustration is embedded, returns null
	 * If the embedded illustration is the same as the release's, nothing is done and return null
	 * If there is no release illustration, extracts the track's illustration and return its path
	 * Otherwise, if there is a release illustration, but the track's differs from it
	 * extracts the track's illustration as a track-specific illustration, and return its path
	 * @param track the track to extract the illustration from
	 */
	async extractTrackIllustration(
		track: Track, fullTrackPath: string
	): Promise<IllustrationPath | null> {
		const release: Release = await this.releaseService.get({ id: track.releaseId });
		const album = await this.albumService.get(
			{ id: release.albumId },
			{ artist: true }
		);
		const releaseSlug = new Slug(release.slug);
		const artistSlug = album.artist ? new Slug(album.artist.slug) : undefined;
		const albumSlug = new Slug(album.slug);
		const releaseIllustrationPath = this.releaseIllustrationService.buildIllustrationPath(
			artistSlug,
			albumSlug,
			releaseSlug
		);
		const discIllustrationPath = this.trackIllustrationService.buildDiscIllustrationPath(
			artistSlug,
			albumSlug,
			releaseSlug,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		const trackIllustrationPath = this.trackIllustrationService.buildIllustrationPath(
			artistSlug,
			albumSlug,
			releaseSlug,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);

		const embeddedIllustration = await this.extractIllustrationFromFile(fullTrackPath);
		const inlineIllustration = await this.extractIllustrationInFileFolder(fullTrackPath);
		const illustration: Buffer | null = (this.settingsService.settingsValues.metadata
			.source == 'embedded' ? embeddedIllustration : inlineIllustration)
			?? (this.settingsService.settingsValues.metadata.order == 'preferred'
				? embeddedIllustration ?? inlineIllustration
				: null);

		if (illustration == null) {
			return null;
		}
		const illustrationBytes = await (await Jimp.read(illustration))
			.getBufferAsync(Jimp.MIME_JPEG);

		for (const path of [releaseIllustrationPath, discIllustrationPath, trackIllustrationPath]) {
			const illustrationExtractionStatus = await this.saveIllustrationWithStatus(
				illustrationBytes, path
			);
			const fileName = basename(track.name);

			if (illustrationExtractionStatus === 'error') {
				throw new IllustrationNotExtracted(`Extracting illustration from '${fileName}' failed`);
			}
			if (illustrationExtractionStatus === 'already-extracted') {
				this.logger.verbose(`Extracting illustration from '${fileName}' already done`);
				return path;
			}
			if (illustrationExtractionStatus === 'extracted') {
				this.logger.verbose(`Extracting illustration from '${fileName}' successful`);
				return path;
			}
			if (illustrationExtractionStatus === 'different-illustration') {
				continue;
			}
		}
		return null;
	}

	private async saveIllustrationWithStatus(
		illustrationBuffer: Buffer, outputPath: string
	): Promise<IllustrationExtractStatus> {
		if (this.fileManagerService.fileExists(outputPath)) {
			const fileContent = this.fileManagerService.getFileContent(outputPath);

			if (fileContent == illustrationBuffer.toString()) {
				return 'already-extracted';
			}
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
	private async extractIllustrationFromFile(filePath: string): Promise<Buffer | null> {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		try {
			const rawMetadata: IAudioMetadata = await mm.parseFile(filePath, {
				skipCovers: false,
			});

			return mm.selectCover(rawMetadata.common.picture)?.data ?? null;
		} catch {
			throw new FileParsingException(filePath);
		}
	}

	/**
	 * Get a stream of the illustration file in the same folder as file
	 * @param filePath the full path to the source file to scrap
	 * @example "./a.m4a" will try to parse "./cover.jpg"
	 */
	private async extractIllustrationInFileFolder(filePath: string): Promise<Buffer | null> {
		const fileFolder = dir.dirname(filePath);
		const illustrationCandidates = glob.sync(`${escapeRegex(fileFolder)}/${IllustrationService.SOURCE_ILLUSTRATON_FILE}`);

		if (illustrationCandidates.length == 0) {
			return null;
		}
		return this.fileManagerService.getFileBuffer(illustrationCandidates[0]);
	}

	/**
	 * Downloads an illustration from a URL, and stores it in the illustration file system
	 * using the provided slug
	 * @param illustrationURL the full path to the source file to scrap
	 * @param outPath path to the file to save the illustration as
	 */
	async downloadIllustration(illustrationURL: string) {
		try {
			const image = await Jimp.read(illustrationURL);

			return image.getBufferAsync(image.getMIME());
		} catch {
			throw new CantDownloadIllustrationException(illustrationURL);
		}
	}

	/**
	 * Saves an illustration in the illustration file system
	 * @param fileContent raw binary content of the file to save
	 * @param outPath path and name of the file to save the fileContent as
	 */
	saveIllustration(fileContent: Buffer, outPath: IllustrationPath) {
		fs.mkdirSync(dir.dirname(outPath), { recursive: true });
		fs.writeFileSync(outPath, fileContent);
	}

	/**
	 * Delete an illustration File
	 * If it does not exist, fail silently
	 */
	deleteIllustration(path: IllustrationPath) {
		try {
			this.fileManagerService.deleteFile(path);
		} catch {
			return;
		}
	}

	/**
	 *
	 * @param sourceFilePath the file path to the illustration to stream
	 * @param as the name of the send tile, without extension
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the illustration
	 */
	async streamIllustration(
		sourceFilePath: string, as: string,
		dimensions: IllustrationDimensionsDto, res: any, ext = '.jpg'
	): Promise<StreamableFile> {
		if (!this.fileManagerService.fileExists(sourceFilePath)) {
			throw new NoIllustrationException("Illustration file not found");
		}

		res.set({
			'Content-Disposition': `attachment; filename="${as}${ext}"`,
		});
		if (dimensions.width || dimensions.height) {
			try {
				const sharpImage = sharp(sourceFilePath);

				if (dimensions.width && dimensions.height) {
					sharpImage.resize(dimensions.width, dimensions.height, { fit: 'fill' });
				} else {
					sharpImage.resize(dimensions.width || dimensions.height);
				}
				return sharpImage
					.jpeg({ quality: dimensions.quality })
					.toBuffer()
					.then((buffer) => new StreamableFile(Readable.from(buffer)));
			} catch (error) {
				this.logger.error(`Streaming of illustration ${sourceFilePath} failed.`);
			}
		}
		return new StreamableFile(fs.createReadStream(sourceFilePath));
	}

	/**
	 * @returns The blurhash of the image's buffer
	 */
	async getIllustrationBlurHash(buffer: Buffer): Promise<string> {
		const image = await Jimp.read(buffer);

		return Blurhash.encode(
			new Uint8ClampedArray(buffer),
			image.getWidth(),
			image.getHeight(),
			0,
			0
		);
	}

	/**
	 * @returns The 5 dominant colors of the image
	 */
	async getIllustrationColors(buffer: Buffer): Promise<string[]> {
		return getColors(buffer)
			.then((colors) => colors.map((color) => color.hex()));
	}
}
