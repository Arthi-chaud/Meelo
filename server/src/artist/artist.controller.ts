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

import { Controller, forwardRef, Get, Inject, Query } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import { DefaultRoleAndMicroservice } from "src/authentication/roles/roles.decorators";
import TransformFilter, { Filter } from "src/filter/filter";
import GenreService from "src/genre/genre.service";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import LabelQueryParameters from "src/label/label.query-parameters";
import LabelService from "src/label/label.service";
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
			"If true, only artists that have at least one album will be returned or whose songs are standalone. It will not return artists that only appear on compilations or ones that are only featuring artists",
	})
	primaryArtistsOnly?: boolean;

	@IsOptional()
	@TransformFilter(GenreService, {
		description: "Filter artists by genre",
	})
	genre?: Filter<GenreQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(LibraryService, {
		description: "Filter artists by library",
	})
	library?: Filter<LibraryQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(AlbumService, {
		description: "Filter artists by albums they appear on",
	})
	album?: Filter<AlbumQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(LabelService, {
		description: "Filter artists by label",
	})
	label?: Filter<LabelQueryParameters.WhereInput>;
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
	@DefaultRoleAndMicroservice()
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
