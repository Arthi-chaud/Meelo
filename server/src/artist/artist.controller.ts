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

import { Controller, Get, Inject, Query, forwardRef } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import GenreService from "src/genre/genre.service";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Response, { ResponseType } from "src/response/response.decorator";
import ArtistService from "./artist.service";
import ArtistQueryParameters from "./models/artist.query-parameters";
import { ArtistResponseBuilder } from "./models/artist.response";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: "Search artists using a string token",
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description:
			"If true, only artists that have at least one album will be returned",
	})
	albumArtistOnly?: boolean;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter artists by genre",
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter artists by library",
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter artists by albums they appear on",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;
}

@ApiTags("Artists")
@Controller("artists")
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
	) {}

	@ApiOperation({
		summary: "Get many artists",
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getMany(
		@Query()
		paginationParameters: PaginationParameters,
		@Query() selector: Selector,
		@Query() sort: ArtistQueryParameters.SortingParameter,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.artistService.search(
				decodeURI(selector.query),
				selector,
				paginationParameters,
				include,
			);
		}
		return this.artistService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get one artist",
	})
	@Response({
		handler: ArtistResponseBuilder,
	})
	@Get(":idOrSlug")
	async get(
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
	) {
		return this.artistService.get(where, include);
	}
}
