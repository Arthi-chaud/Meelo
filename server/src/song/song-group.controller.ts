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
import { ApiOperation, ApiTags, PickType } from "@nestjs/swagger";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Response, { ResponseType } from "src/response/response.decorator";
import SongQueryParameters from "./models/song.query-params";
import SongGroupQueryParameters from "./models/song-group.query-params";
import { SongGroupResponseBuilder } from "./models/song-group.response";
import { Selector } from "./song.controller";
import SongGroupService from "./song-group.service";

class SongGroupSelector extends PickType(Selector, [
	"artist",
	"album",
	"library",
	"genre",
	"query",
	"type",
]) {}

@ApiTags("Song Groups")
@Controller("song-groups")
export class SongGroupController {
	constructor(private songGroupService: SongGroupService) {}
	@ApiOperation({
		summary: "Get song groups",
	})
	@Response({
		handler: SongGroupResponseBuilder,
		type: ResponseType.Page,
		paginationIdKey: "groupId",
	})
	@Get()
	async getSongs(
		@Query() selector: SongGroupSelector,
		@Query() sort: SongGroupQueryParameters.SortingParameter,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
	) {
		return this.songGroupService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}
}
