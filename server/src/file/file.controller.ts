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

import { Controller, Get, Query } from "@nestjs/common";
import { File } from "src/prisma/models";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";
import { IsOptional } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import Response, { ResponseType } from "src/response/response.decorator";
import { DefaultRoleAndMicroservice } from "src/authentication/roles/roles.decorators";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter files by folder. The folder os relative to the parent library",
	})
	inFolder?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter files by library",
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;
}

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

	@ApiOperation({
		summary: "Get multiple File entries",
	})
	@DefaultRoleAndMicroservice()
	@Get()
	@Response({
		returns: File,
		type: ResponseType.Page,
	})
	getMany(
		@Query() selector: Selector,
		@Query()
		paginationParameters: PaginationParameters,
	) {
		return this.fileService.getMany(
			{
				library: selector.library,
				inFolder: selector.inFolder,
			},
			paginationParameters,
		);
	}
}
