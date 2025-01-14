/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable, StreamableFile } from "@nestjs/common";
import FileManagerService from "src/file-manager/file-manager.service";
import {
	CantDownloadIllustrationException,
	NoIllustrationException,
} from "./illustration.exceptions";
// eslint-disable-next-line no-restricted-imports
import * as fs from "fs";
import * as dir from "path";
import type { IllustrationPath } from "./models/illustration-path.model";
import Jimp from "jimp";
import { Readable } from "stream";
import type { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";
import Logger from "src/logger/logger";
import * as Blurhash from "blurhash";
import getColors from "get-image-colors";
import mime from "mime";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { ImageQuality } from "./models/illustration-quality";
import { HttpService } from "@nestjs/axios";
import { version } from "package.json";
import IllustrationStats from "./models/illustration-stats";
import md5 from "md5";

/**
 * A service to handle illustration files (downloads, extractions, conversion & streaming)
 * For anything related to Illustration models, see `Illustration Repository`
 */
@Injectable()
export default class IllustrationService {
	private readonly logger = new Logger(IllustrationService.name);

	constructor(
		private fileManagerService: FileManagerService,
		private readonly httpService: HttpService,
	) {}

	/**
	 * Downloads an illustration from a URL, and stores it in the illustration file system
	 * using the provided slug
	 * @param illustrationURL the full path to the source file to scrap
	 * @param outPath path to the file to save the illustration as
	 */
	async downloadIllustration(illustrationURL: string) {
		try {
			return Buffer.from(
				(
					await this.httpService.axiosRef.get(illustrationURL, {
						responseType: "arraybuffer",
						headers: {
							"User-Agent": "Meelo v" + version,
						},
					})
				).data,
				"binary",
			);
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
		this.deleteIllustration(outPath);
		fs.mkdirSync(dir.dirname(outPath), { recursive: true });
		fs.writeFileSync(outPath, fileContent);
	}

	/**
	 * Delete an illustration File
	 * If it does not exist, fail silently
	 * Will also delete the related converted images
	 */
	deleteIllustration(path: IllustrationPath) {
		try {
			this.fileManagerService.deleteFile(path);
		} catch {
			/* empty */
		}
		ImageQuality.map((quality) => {
			try {
				const pathOfFile = dir.join(
					dir.dirname(path),
					dir.parse(path).name + "-" + quality + dir.extname(path),
				);
				this.fileManagerService.deleteFile(pathOfFile);
			} catch {
				/* empty */
			}
		});
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

	async resizeImageTo(
		sourcePath: string,
		outputPath: string,
		quality: ImageQuality,
	) {
		const image = await Jimp.read(sourcePath);
		switch (quality) {
			case "low":
				image.resize(100, Jimp.AUTO);
				break;
			case "medium":
				image.resize(300, Jimp.AUTO);
				break;
			case "high":
				image.resize(500, Jimp.AUTO);
				break;
		}
		await image.writeAsync(outputPath);
	}

	/**
	 *
	 * @param sourceFilePath the file path to the illustration to stream
	 * @param as the name of the send tile, without extension
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the illustration
	 */
	async streamIllustration(
		sourceFilePath: string,
		as: string,
		dimensions: IllustrationDimensionsDto,
		res: any,
		ext = ".jpg",
	): Promise<StreamableFile> {
		if (!this.fileManagerService.fileExists(sourceFilePath)) {
			throw new NoIllustrationException("Illustration file not found");
		}
		if ((dimensions.height || dimensions.width) && dimensions.quality) {
			throw new InvalidRequestException(
				"Expected Quality or Dimensions, not both.",
			);
		}
		if (dimensions.quality) {
			const quality = dimensions.quality;
			const pathOfFile = dir.join(
				dir.dirname(sourceFilePath),
				dir.parse(sourceFilePath).name + "-" + quality + ext,
			);
			if (!this.fileManagerService.fileExists(pathOfFile)) {
				await this.resizeImageTo(sourceFilePath, pathOfFile, quality);
			}
			return new StreamableFile(fs.createReadStream(pathOfFile), {
				type: mime.getType(pathOfFile)?.toString(),
			});
		} else if (dimensions.width || dimensions.height) {
			try {
				const image = await Jimp.read(sourceFilePath);

				if (dimensions.width && dimensions.height) {
					image.cover(dimensions.width, dimensions.height);
				} else {
					const [originalWidth, originalHeight] = [
						image.getWidth(),
						image.getHeight(),
					];
					const ratio = dimensions.height
						? dimensions.height / originalHeight
						: dimensions.width! / originalWidth;
					image.cover(
						dimensions.width ?? originalWidth * ratio,
						dimensions.height ?? originalHeight * ratio,
					);
				}
				return image
					.getBufferAsync(Jimp.MIME_JPEG)
					.then(
						(buffer) => new StreamableFile(Readable.from(buffer)),
					);
			} catch (error) {
				this.logger.error(
					`Streaming of illustration ${sourceFilePath} failed.`,
				);
			}
		}
		return new StreamableFile(fs.createReadStream(sourceFilePath), {
			type: mime.getType(sourceFilePath)?.toString(),
		});
	}

	async getImageHash(buffer: Buffer): Promise<string> {
		return md5(buffer);
	}

	async getImageStats(buffer: Buffer): Promise<IllustrationStats> {
		const image = await Jimp.read(buffer);
		const aspectRatio = image.getWidth() / image.getHeight();

		return Promise.all([
			new Promise<string>((resolve) => {
				const [componentX, componentY] =
					this.getBlurhashComponentCountFromAspectRatio(aspectRatio);
				const isHorizontal = image.getWidth() > image.getHeight();
				const ratio = isHorizontal
					? image.getWidth() / image.getHeight()
					: image.getHeight() / image.getWidth();
				const width = 50;
				const height = isHorizontal ? width / ratio : width * ratio;
				const smallImage = image.resize(width, height);
				resolve(
					Blurhash.encode(
						Uint8ClampedArray.from(smallImage.bitmap.data),
						smallImage.getWidth(),
						smallImage.getHeight(),
						componentX,
						componentY,
					),
				);
			}),
			getColors(buffer, { type: image.getMIME() }).then((colors) =>
				colors.map((color) => color.hex()),
			),
		]).then(([blurhash, colors]) => ({
			blurhash,
			colors,
			aspectRatio,
		}));
	}

	/**
	 * Computes the values of componentX and componentY used by the blurhasing function
	 * These components represent the max number of colors on each axis
	 */
	private getBlurhashComponentCountFromAspectRatio(
		aspectRatio: number,
		baseComponentCount = 4,
	): [number, number] {
		return [
			// there should be at least 1 component per axis
			Math.max(
				1,
				Math.min(
					Math.round(baseComponentCount * aspectRatio),
					baseComponentCount,
				),
			),
			Math.max(
				1,
				Math.min(
					Math.round(baseComponentCount / aspectRatio),
					baseComponentCount,
				),
			),
		];
	}
}
