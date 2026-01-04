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
	forwardRef,
	Get,
	Inject,
	Put,
	Query,
} from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { AlbumType } from "src/prisma/generated/client";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import {
	DefaultRoleAndMicroservice,
	Role,
} from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import TransformFilter, {
	EnumFilter,
	Filter,
	TransformEnumFilter,
} from "src/filter/filter";
import GenreService from "src/genre/genre.service";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import LabelQueryParameters from "src/label/label.query-parameters";
import LabelService from "src/label/label.service";
import LibraryService from "src/library/library.service";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Response, { ResponseType } from "src/response/response.decorator";
import AlbumService from "./album.service";
import AlbumQueryParameters from "./models/album.query-parameters";
import { AlbumResponseBuilder } from "./models/album.response";
import UpdateAlbumDTO from "./models/update-album.dto";

class Selector {
	@IsOptional()
	@TransformEnumFilter(AlbumType, {
		description: "Filter the albums by type",
	})
	type?: EnumFilter<AlbumType>;

	@IsOptional()
	@TransformFilter(ArtistService, {
		description: `Filter albums by album artist, using their identifier.<br/>
		For compilation albums, use '${compilationAlbumArtistKeyword}'`,
	})
	artist?: Filter<ArtistQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(ArtistService, {
		description:
			"Get albums where an artist appear (i.e. is not their main artist), using their identifier.",
	})
	appearance?: Filter<ArtistQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(GenreService, {
		description: "Filter albums by genre",
	})
	genre?: Filter<GenreQueryParameters.WhereInput>;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Search albums using a string token",
	})
	query?: string;

	@IsOptional()
	@TransformFilter(LibraryService, {
		description: "Filter albums by library",
	})
	library?: Filter<LibraryQueryParameters.WhereInput>;

	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Get related albums (i.e. from the same album artist & have at least one song in common)",
	})
	@TransformIdentifier(AlbumService)
	related?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "The Seed to Sort the items",
	})
	@IsNumber()
	@IsPositive()
	random?: number;

	@IsOptional()
	@TransformFilter(LabelService, {
		description: "Filter albums by label",
	})
	label?: Filter<LabelQueryParameters.WhereInput>;
}

@ApiTags("Albums")
@Controller("albums")
export default class AlbumController {
	constructor(
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
	) {}

	@Get()
	@Response({
		handler: AlbumResponseBuilder,
		type: ResponseType.Page,
	})
	@ApiOperation({ summary: "Get many albums" })
	async getMany(
		@Query() selector: Selector,
		@Query() sort: AlbumQueryParameters.SortingParameter,
		@Query() paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.albumService.search(
				decodeURI(selector.query),
				selector,
				paginationParameters,
				include,
			);
		}
		return this.albumService.getMany(
			selector,
			selector.random ?? sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get one album",
	})
	@Get(":idOrSlug")
	@DefaultRoleAndMicroservice()
	@Response({ handler: AlbumResponseBuilder })
	async get(
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.albumService.get(where, include);
	}

	@ApiOperation({
		summary: "Update the album",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Response({ handler: AlbumResponseBuilder })
	@Put(":idOrSlug")
	async updateAlbum(
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
		@Body() { masterReleaseId, ...updateAlbumDTO }: UpdateAlbumDTO,
	) {
		const album = await this.albumService.get(where);

		return this.albumService.update(
			{
				master: masterReleaseId ? { id: masterReleaseId } : undefined,
				...updateAlbumDTO,
			},
			{ id: album.id },
		);
	}
}
