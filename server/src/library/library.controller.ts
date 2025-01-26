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

import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Put,
	Query,
	SetMetadata,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
	Admin,
	DefaultRoleAndMicroservice,
} from "src/authentication/roles/roles.decorators";
import IdentifierParam from "src/identifier/identifier.pipe";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Library } from "src/prisma/models";
import Response, { ResponseType } from "src/response/response.decorator";
import LibraryService from "./library.service";
import CreateLibraryDto from "./models/create-library.dto";
import LibraryQueryParameters from "./models/library.query-parameters";
import UpdateLibraryDto from "./models/update-library.dto";

@ApiTags("Libraries")
@Controller("libraries")
export default class LibraryController {
	constructor(private libraryService: LibraryService) {}

	@ApiOperation({
		summary: "Create a new library",
	})
	@Response({
		returns: Library,
	})
	@Admin()
	@Post()
	async createLibrary(@Body() createLibraryDto: CreateLibraryDto) {
		return this.libraryService.create(createLibraryDto);
	}

	@ApiOperation({
		summary: "Get a library",
	})
	@Get(":idOrSlug")
	@DefaultRoleAndMicroservice()
	async getLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.get(where);
	}

	@ApiOperation({
		summary: "Update a library",
	})
	@Admin()
	@Put(":idOrSlug")
	async updateLibrary(
		@Body() updateLibraryDTO: UpdateLibraryDto,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.update(updateLibraryDTO, where);
	}

	@ApiOperation({
		summary: "Get many libraries",
	})
	@Get()
	@Response({
		returns: Library,
		type: ResponseType.Page,
	})
	@DefaultRoleAndMicroservice()
	async getLibraries(
		@Query()
		paginationParameters: PaginationParameters,
		@Query()
		sortingParameter: LibraryQueryParameters.SortingParameter,
	) {
		return this.libraryService.getMany(
			{},
			sortingParameter,
			paginationParameters,
		);
	}

	@ApiOperation({
		summary: "Delete a library",
		description: "Hangs while the library gets deleted",
	})
	@SetMetadata("request-timeout", 60000)
	@Admin()
	@Delete(":idOrSlug")
	async deleteLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	) {
		const library = await this.libraryService.get(where);

		await this.libraryService.delete(where);
		return library;
	}
}
