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
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { DefaultRoleAndMicroservice } from "src/authentication/roles/roles.decorators";
import TransformFilter, { Filter } from "src/filter/filter";
import IdentifierParam from "src/identifier/identifier.pipe";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Label } from "src/prisma/models";
import Response, { ResponseType } from "src/response/response.decorator";
import LabelQueryParameters from "./label.query-parameters";
import LabelService from "./label.service";

class Selector {
	@IsOptional()
	@TransformFilter(ArtistService, { description: "Filter labels by artist" })
	artist?: Filter<ArtistQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(AlbumService, { description: "Filter labels by albums" })
	album?: Filter<AlbumQueryParameters.WhereInput>;
}

@ApiTags("Labels")
@Controller("labels")
export default class LabelController {
	constructor(private labelService: LabelService) {}

	@Get()
	@ApiOperation({ summary: "Get many labels" })
	@Response({
		type: ResponseType.Page,
		returns: Label,
	})
	@DefaultRoleAndMicroservice()
	async getMany(
		@Query() selector: Selector,
		@Query() sort: LabelQueryParameters.SortingParameter,
		@Query() paginationParameters: PaginationParameters,
	) {
		return this.labelService.getMany(selector, sort, paginationParameters);
	}

	@Get(":idOrSlug")
	@ApiOperation({ summary: "Get a label" })
	async get(
		@IdentifierParam(LabelService)
		where: LabelQueryParameters.WhereInput,
	): Promise<Label> {
		return this.labelService.get(where);
	}
}
