import sharp from 'sharp';
import { Injectable, StreamableFile } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import escapeRegex from 'src/utils/escape-regex';
import { CantDownloadIllustrationException, NoIllustrationException } from './illustration.exceptions';
import mm, { type IAudioMetadata } from 'music-metadata';
// eslint-disable-next-line no-restricted-imports
import * as fs from 'fs';
import { FileParsingException } from 'src/metadata/metadata.exceptions';
import * as dir from 'path';
import type { IllustrationFolderPath, IllustrationPath } from './models/illustration-path.model';
import Jimp from 'jimp';
import { FileDoesNotExistException } from 'src/file-manager/file-manager.exceptions';
import { Readable } from 'stream';
import type { IllustrationDimensionsDto } from './models/illustration-dimensions.dto';
import glob from 'glob';
import Logger from 'src/logger/logger';
import * as Blurhash from 'blurhash';
import getColors from 'get-image-colors';
import mime from 'mime';

type IllustrationExtractStatus = 'extracted' | 'error' | 'already-extracted' | 'different-illustration';

/**
 * A service to handle illustration files (downloads, extractions, conversion & streaming)
 * For anything related to Illustration models, see `Illustration Repository`
 */
@Injectable()
export default class IllustrationService {
	private readonly logger = new Logger(IllustrationService.name);

	constructor(
		private fileManagerService: FileManagerService
	) {}

	/**
	 * Regular Expression to match source cover files
	 */
	public static SOURCE_ILLUSTRATON_FILE = '[Cc]over.*';

	/**
	 * Extracts the embedded illustration of a file
	 * @param filePath the full path to the source file to scrap
	 */
	async extractIllustrationFromFile(filePath: string): Promise<Buffer | null> {
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
	async extractIllustrationInFileFolder(filePath: string): Promise<Buffer | null> {
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

	async saveIllustrationWithStatus(
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
	 * Delete an illustration Folder
	 * If it does not exist, fail silently
	 */
	deleteIllustrationFolder(path: IllustrationPath) {
		try {
			this.fileManagerService.deleteFolder(path);
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
		return new StreamableFile(
			fs.createReadStream(sourceFilePath),
			{ type: mime.getType(sourceFilePath)?.toString() }
		);
	}

	async getIllustrationBlurHashAndColors(buffer: Buffer): Promise<[string, string[]]> {
		const image = await Jimp.read(buffer);

		return Promise.all([
			new Promise<string>((resolve) => {
				const array = new Uint8ClampedArray(image.bitmap.data.length);

				image.bitmap.data.map((char, index) => array[index] = char);
				resolve(Blurhash.encode(
					array,
					image.getWidth(),
					image.getHeight(),
					// Represent the max number of colors on each axis
					6,
					6
				));
			}),
			getColors(buffer, { type: image.getMIME() })
				.then((colors) => colors.map((color) => color.hex()))
		]);
	}

	async moveIllustrationFolder(
		oldPath: IllustrationFolderPath,
		newPath: IllustrationFolderPath
	) {
		if (this.fileManagerService.folderExists(oldPath)) {
			fs.mkdirSync(dir.dirname(newPath), { recursive: true });
			this.fileManagerService.rename(oldPath, newPath);
		}
	}
}
