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

import { Injectable } from "@nestjs/common";
// eslint-disable-next-line no-restricted-imports
import Ffmpeg from "fluent-ffmpeg";
import { FileDoesNotExistException } from "src/file-manager/file-manager.exceptions";
import FileManagerService from "src/file-manager/file-manager.service";
// eslint-disable-next-line no-restricted-imports
import * as fs from "fs";
import * as dir from "path";
import Logger from "src/logger/logger";
import { IllustrationPath } from "src/illustration/models/illustration-path.model";

@Injectable()
export default class FfmpegService {
	private readonly logger = new Logger(FfmpegService.name);
	constructor(private fileManagerService: FileManagerService) {}

	/**
	 * Takes a screenshot of a video file's content
	 * @param videoPath the full path of a video file
	 * @param outPath the path to the output illustration
	 */
	takeVideoScreenshot(
		videoPath: string,
		outPath: IllustrationPath,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.fileManagerService.fileExists(videoPath)) {
				throw new FileDoesNotExistException(videoPath);
			}

			fs.mkdir(dir.dirname(outPath), { recursive: true }, () => {});
			Ffmpeg(videoPath)
				.thumbnail({
					count: 1,
					filename: dir.basename(outPath),
					folder: dir.dirname(outPath),
				})
				.on("error", () => {
					reject();
					this.logger.error(
						`Taking a screenshot of '${dir.basename(
							videoPath,
						)}' failed`,
					);
				})
				.on("end", () => {
					resolve();
					this.logger.log(
						`Taking a screenshot of '${dir.basename(
							videoPath,
						)}' succeded`,
					);
				});
		});
	}
}
