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
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Genre } from "src/prisma/models";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Response, { ResponseType } from "src/response/response.decorator";
import type SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import GenreService from "./genre.service";
import GenreQueryParameters from "./models/genre.query-parameters";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter genres by album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter genres by artist",
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter genres by song",
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;
}

@ApiTags("Genres")
@Controller("genres")
export class GenreController {
	constructor(private genreService: GenreService) {}

	@ApiOperation({
		summary: "Get many genres",
	})
	@Get()
	@Response({
		returns: Genre,
		type: ResponseType.Page,
	})
	async getMany(
		@Query() selector: Selector,
		@Query() sort: GenreQueryParameters.SortingParameter,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
	) {
		return this.genreService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get a genre",
	})
	@Response({ returns: Genre })
	@Get(":idOrSlug")
	async get(
		@IdentifierParam(GenreService)
		where: GenreQueryParameters.WhereInput,
	) {
		return this.genreService.get(where);
	}
}
