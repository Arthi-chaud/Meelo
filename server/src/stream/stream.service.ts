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

import { HttpStatus, Injectable, StreamableFile } from "@nestjs/common";
import FileManagerService from "src/file-manager/file-manager.service";
import FileService from "src/file/file.service";
import FileQueryParameters from "src/file/models/file.query-parameters";
// eslint-disable-next-line no-restricted-imports
import * as fs from "fs";
import path from "path";
import mime from "mime";
import { SourceFileNotFoundException } from "src/file/file.exceptions";
import Slug from "src/slug/slug";

@Injectable()
export class StreamService {
	constructor(
		private fileService: FileService,
		private fileManagerService: FileManagerService,
	) {}
	/**
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the file
	 */
	async streamFile(
		where: FileQueryParameters.WhereInput,
		res: any,
		req: any,
	): Promise<StreamableFile> {
		const file = await this.fileService.get(where);
		const fullFilePath = await this.fileService.buildFullPath(where);
		const fileExtension = path.parse(fullFilePath).ext;
		const sanitizedFileName = new Slug(
			path.parse(file.path).name,
		).toString();

		if (this.fileManagerService.fileExists(fullFilePath) == false) {
			throw new SourceFileNotFoundException(file.path);
		}
		res.set({
			"Content-Disposition": `attachment; filename="${sanitizedFileName}${fileExtension}"`,
			"Content-Type":
				mime.getType(fullFilePath) ?? "application/octet-stream",
		});
		const rangeHeader = req.headers["range"] ?? req.headers["Range"];
		let requestedStartByte: number | undefined = undefined;
		let requestedEndByte: number | undefined = undefined;

		if (rangeHeader) {
			res.status(HttpStatus.PARTIAL_CONTENT);
			// eslint-disable-next-line no-useless-escape
			const bytes = /^bytes\=(\d+)\-(\d+)?$/g.exec(rangeHeader);

			if (bytes) {
				const fileSize = fs.statSync(fullFilePath).size;

				requestedStartByte = Number(bytes[1]);
				requestedEndByte = Number(bytes[2]) || fileSize - 1;
				res.set({
					"Content-Range": `bytes ${requestedStartByte}-${requestedEndByte}/${fileSize}`,
				});
			}
		}

		return new StreamableFile(
			fs.createReadStream(fullFilePath, {
				start: requestedStartByte,
				end: requestedEndByte,
			}),
		);
	}
}
