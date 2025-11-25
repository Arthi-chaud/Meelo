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
import path from "node:path";
import { HttpService } from "@nestjs/axios";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { createProxyMiddleware } from "http-proxy-middleware";
import mime from "mime";
import { MeeloException } from "src/exceptions/meelo-exception";
import { SourceFileNotFoundException } from "src/file/file.exceptions";
import FileService from "src/file/file.service";
import type FileQueryParameters from "src/file/models/file.query-parameters";
import FileManagerService from "src/file-manager/file-manager.service";
import Logger from "src/logger/logger";
import Slug from "src/slug/slug";

@Injectable()
export class StreamService {
	private transcoderUrl: string | null;
	private logger: Logger = new Logger(StreamService.name);
	constructor(
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private fileManagerService: FileManagerService,
		private httpService: HttpService,
	) {
		this.transcoderUrl = process.env.TRANSCODER_URL ?? null;
		if (this.transcoderUrl) {
			this.httpService.axiosRef
				.get(this.transcoderUrl, { validateStatus: (s) => s < 500 })
				.then(() => {
					// there is no healthcheck route atm
					// knowing that it responded is OK
					this.logger.log("Transcoder found!");
				})
				.catch((err) => {
					this.logger.warn(
						"Failed to connect to transcoder. Transcoding is disabled.",
					);
					this.logger.error(err);
					this.transcoderUrl = null;
				});
		}
	}

	public get transcoderAvailable() {
		return this.transcoderUrl != null;
	}

	// Proxies all requests to transcoder
	async callTranscoder(
		where: FileQueryParameters.WhereInput,
		route: string,
		res: any,
		req: any,
	): Promise<void> {
		if (!this.transcoderUrl) {
			throw new MeeloException(
				HttpStatus.SERVICE_UNAVAILABLE,
				"Transcoder not plugged in",
			);
		}
		const fullFilePath = await this.fileService.buildFullPath(where);
		const proxy = createProxyMiddleware({
			router: () =>
				`${this.transcoderUrl}/video/${Buffer.from(
					fullFilePath,
				).toString("base64url")}/${route}`,
			ignorePath: true,
		});
		await proxy(req, res);
		return;
	}

	async streamFile(
		where: FileQueryParameters.WhereInput,
		res: any,
		req: any,
	): Promise<void> {
		const fullFilePath = await this.fileService.buildFullPath(where);
		if (this.transcoderUrl) {
			return this.callTranscoder(where, "direct", res, req);
		}
		return this._directStreamFile(fullFilePath, res, req);
	}

	/**
	 * @param res the Response Object of the request
	 */
	async _directStreamFile(
		fullFilePath: string,
		res: any,
		req: any,
	): Promise<void> {
		const fileExtension = path.parse(fullFilePath).ext;
		const sanitizedFileName = new Slug(
			path.parse(fullFilePath).name,
		).toString();

		if (this.fileManagerService.fileExists(fullFilePath) === false) {
			throw new SourceFileNotFoundException(
				path.parse(fullFilePath).name,
			);
		}
		res.set({
			"Content-Disposition": `attachment; filename="${sanitizedFileName}${fileExtension}"`,
			"Content-Type":
				mime.getType(fullFilePath) ?? "application/octet-stream",
		});
		// biome-ignore lint/complexity/useLiteralKeys: Headers is more like a dict than an object
		const rangeHeader = req.headers["range"] ?? req.headers["Range"];
		let requestedStartByte: number | undefined;
		let requestedEndByte: number | undefined;

		if (rangeHeader) {
			res.status(HttpStatus.PARTIAL_CONTENT);
			const bytes = /^bytes=(\d+)-(\d+)?$/g.exec(rangeHeader);

			if (bytes) {
				const fileSize = fs.statSync(fullFilePath).size;

				requestedStartByte = Number(bytes[1]);
				requestedEndByte = Number(bytes[2]) || fileSize - 1;
				res.set({
					"Content-Range": `bytes ${requestedStartByte}-${requestedEndByte}/${fileSize}`,
				});
			}
		}
		try {
			fs.createReadStream(fullFilePath, {
				start: requestedStartByte,
				end: requestedEndByte,
			}).pipe(res);
		} catch (err) {
			this.logger.error(err);
		}
	}
}
