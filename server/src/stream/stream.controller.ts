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

import { Controller, Get, Req, Response } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import FileService from "src/file/file.service";
import FileQueryParameters from "src/file/models/file.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import { StreamService } from "./stream.service";

@Controller("stream")
export class StreamController {
	constructor(private streamService: StreamService) {}
	@ApiOperation({
		summary: "Get one File's content",
	})
	@Get(":idOrSlug")
	async streamFile(
		@IdentifierParam(FileService)
		where: FileQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
		@Req() req: Express.Request,
	) {
		return this.streamService.streamFile(where, res, req);
	}
}
