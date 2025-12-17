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

import * as fs from "node:fs";
import * as dir from "node:path";
import { Readable } from "node:stream";
import { HttpService } from "@nestjs/axios";
import { Injectable, StreamableFile } from "@nestjs/common";
import * as Blurhash from "blurhash";
import { Jimp } from "jimp";
import md5 from "md5";
import mime from "mime";
import { version } from "package.json";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import FileManagerService from "src/file-manager/file-manager.service";
import Logger from "src/logger/logger";
import {
	CantDownloadIllustrationException,
	NoIllustrationException,
} from "./illustration.exceptions";
import type { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";
import type { IllustrationPath } from "./models/illustration-path.model";
import { ImageQuality } from "./models/illustration-quality";
import type IllustrationStats from "./models/illustration-stats";

const getPalette = require("get-rgba-palette");

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
							"User-Agent": `Meelo v${version}`,
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

		// biome-ignore lint: All cases are covered
		ImageQuality.map((quality) => {
			try {
				const pathOfFile = dir.join(
					dir.dirname(path),
					`${dir.parse(path).name}-${quality}${dir.extname(path)}`,
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
				image.resize({ w: 100 });
				break;
			case "medium":
				image.resize({ w: 300 });
				break;
			case "high":
				image.resize({ w: 500 });
				break;
		}
		await image.write(outputPath as any);
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
		_as: string,
		dimensions: IllustrationDimensionsDto,
		_res: any,
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
				`${dir.parse(sourceFilePath).name}-${quality}${ext}`,
			);
			if (!this.fileManagerService.fileExists(pathOfFile)) {
				await this.resizeImageTo(sourceFilePath, pathOfFile, quality);
			}
			return new StreamableFile(fs.createReadStream(pathOfFile), {
				type: mime.getType(pathOfFile)?.toString(),
			});
		}
		if (dimensions.width || dimensions.height) {
			try {
				const image = await Jimp.read(sourceFilePath);

				if (dimensions.width && dimensions.height) {
					image.cover({ w: dimensions.width, h: dimensions.height });
				} else {
					const [originalWidth, originalHeight] = [
						image.width,
						image.height,
					];
					const ratio = dimensions.height
						? dimensions.height / originalHeight
						: dimensions.width! / originalWidth;
					image.cover({
						w: dimensions.width ?? originalWidth * ratio,
						h: dimensions.height ?? originalHeight * ratio,
					});
				}
				return image
					.getBuffer("image/jpeg")
					.then(
						(buffer) => new StreamableFile(Readable.from(buffer)),
					);
			} catch {
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
		const image = await Jimp.read(buffer, {
			"image/jpeg": { maxMemoryUsageInMB: 1024 },
		});
		const aspectRatio = image.width / image.height;

		return Promise.all([
			new Promise<string>((resolve) => {
				const [componentX, componentY] =
					this.getBlurhashComponentCountFromAspectRatio(aspectRatio);
				const isHorizontal = image.width > image.height;
				const ratio = isHorizontal
					? image.width / image.height
					: image.height / image.width;
				const width = 50;
				const height = isHorizontal ? width / ratio : width * ratio;
				const smallImage = image.resize({ w: width, h: height });
				resolve(
					Blurhash.encode(
						Uint8ClampedArray.from(smallImage.bitmap.data),
						smallImage.width,
						smallImage.height,
						componentX,
						componentY,
					),
				);
			}),
			this.getImageColors(image.bitmap.data),
		]).then(([blurhash, colors]) => ({
			blurhash,
			colors,
			aspectRatio,
		}));
	}

	// Returns a list of 5 prominent colors
	async getImageColors(buffer: Buffer): Promise<string[]> {
		const colors = getPalette(buffer, 5);
		return colors.map(
			(rgb: number[]) =>
				`#${rgb
					.reduce((total, curr) => total * 256 + curr, 0)
					.toString(16)}`,
		);
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
