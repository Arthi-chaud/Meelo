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

import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import {
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	getSchemaPath,
} from "@nestjs/swagger";
import {
	AlbumResponse,
	AlbumResponseBuilder,
} from "src/album/models/album.response";
import {
	ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import type {
	AlbumWithRelations,
	Artist,
	Song,
	User,
	Video,
} from "src/prisma/models";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";
import {
	VideoResponse,
	VideoResponseBuilder,
} from "src/video/models/video.response";
import { CreateSearchHistoryEntry } from "./models/create-search-history-entry.dto";
import { getSearchResourceType } from "./search.utils";
import { SearchHistoryService } from "./search-history.service";

@ApiTags("Search")
@Controller("search/history")
export class SearchHistoryController {
	constructor(
		private searchHistoryService: SearchHistoryService,
		private artistResponseBuilder: ArtistResponseBuilder,
		private albumResponseBuilder: AlbumResponseBuilder,
		private songResponseBuilder: SongResponseBuilder,
		private videoResponseBuilder: VideoResponseBuilder,
	) {}

	@ApiOperation({
		summary: "Save an entry in the search history",
		description: "There should be exactly one ID in the DTO.",
	})
	@Role(Roles.User)
	@Post()
	async createSearchHistoryEntry(
		@Body() dto: CreateSearchHistoryEntry,
		@Req() request: Express.Request,
	) {
		return this.searchHistoryService.createEntry(
			dto,
			(request.user as User).id,
		);
	}

	@ApiOperation({
		summary: "Get Search History",
	})
	@Role(Roles.User)
	@Get()
	@ApiOkResponse({
		schema: {
			type: "array",
			items: {
				oneOf: [
					ArtistResponse,
					AlbumResponse,
					SongResponse,
					VideoResponse,
				].map((resType) => ({ $ref: getSchemaPath(resType) })),
			},
		},
	})
	async getSearchHistory(
		@Query() pagination: PaginationParameters,
		@Req() request: Express.Request,
	) {
		const history = await this.searchHistoryService.getHistory(
			(request.user as User).id,
			pagination,
		);
		return Promise.all(
			// biome-ignore lint: All cases are covered
			history.map((item) => {
				switch (getSearchResourceType(item)) {
					case "video":
						return this.videoResponseBuilder.buildResponse(
							item as Video,
						);
					case "album":
						return this.albumResponseBuilder.buildResponse(
							item as AlbumWithRelations,
						);
					case "song":
						return this.songResponseBuilder.buildResponse(
							item as Song,
						);
					case "artist":
						return this.artistResponseBuilder.buildResponse(
							item as Artist,
						);
				}
			}),
		);
	}
}
