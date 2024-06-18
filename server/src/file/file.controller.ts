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

import { Controller, Get } from "@nestjs/common";
import type { File } from "src/prisma/models";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";

@ApiTags("Files")
@Controller("files")
export default class FileController {
	constructor(private fileService: FileService) {}

	@ApiOperation({
		summary: "Get one 'File'",
	})
	@Get(":idOrSlug")
	get(
		@RelationIncludeQuery(FileQueryParameters.AvailableAtomicIncludes)
		include: FileQueryParameters.RelationInclude,
		@IdentifierParam(FileService)
		where: FileQueryParameters.WhereInput,
	): Promise<File> {
		return this.fileService.get(where, include);
	}
}
