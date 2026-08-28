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

import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import IdentifierParam from "src/identifier/identifier.pipe";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Series } from "src/prisma/models";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Response, { ResponseType } from "src/response/response.decorator";
import { UpdateSeriesDTO } from "./models/update-series.dto";
import SeriesQueryParameters from "./series.query-parameters";
import { SeriesService } from "./series.service";

@ApiTags("Series")
@Controller("series")
export default class SeriesController {
	constructor(private seriesService: SeriesService) {}

	@Get()
	@ApiOperation({ summary: "Get many series" })
	@Response({
		type: ResponseType.Page,
		returns: Series,
	})
	async getMany(
		@Query() sort: SeriesQueryParameters.SortingParameter,
		@Query() paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SeriesQueryParameters.AvailableAtomicIncludes)
		include: SeriesQueryParameters.RelationInclude,
	) {
		return this.seriesService.getMany(
			{},
			sort,
			paginationParameters,
			include,
		);
	}

	@Get(":idOrSlug")
	@ApiOperation({ summary: "Get a series" })
	@Role(Roles.Microservice, Roles.Default)
	async get(
		@IdentifierParam(SeriesService)
		where: SeriesQueryParameters.WhereInput,
		@RelationIncludeQuery(SeriesQueryParameters.AvailableAtomicIncludes)
		include: SeriesQueryParameters.RelationInclude,
	): Promise<Series> {
		return this.seriesService.get(where, include);
	}

	@ApiOperation({
		summary: "Update one series",
	})
	@Role(Roles.Microservice, Roles.Admin)
	@Put(":idOrSlug")
	async update(
		@IdentifierParam(SeriesService)
		where: SeriesQueryParameters.WhereInput,
		@Body() what: UpdateSeriesDTO,
	): Promise<Series> {
		return this.seriesService.update(what, where);
	}
}
