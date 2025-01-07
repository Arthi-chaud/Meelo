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
import {
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	getSchemaPath,
} from "@nestjs/swagger";
import { SearchService } from "./search.service";
import {
	ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";
import {
	AlbumResponse,
	AlbumResponseBuilder,
} from "src/album/models/album.response";
import { AlbumWithRelations, Artist, Song } from "src/prisma/models";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import {
	VideoResponse,
	VideoResponseBuilder,
} from "src/video/models/video.response";
import { Video } from "@prisma/client";

@ApiTags("Search")
@Controller("search")
export class SearchController {
	constructor(
		private searchService: SearchService,
		private artistResponseBuilder: ArtistResponseBuilder,
		private albumResponseBuilder: AlbumResponseBuilder,
		private songResponseBuilder: SongResponseBuilder,
		private videoResponseBuilder: VideoResponseBuilder,
	) {}
	@ApiOperation({
		summary: "Search artists, albums, songs and videos all in one!",
		description:
			"Returns an ordered list of matching artists, songs and albums. \
			No pagination paramters. \
			Artists come with their respective illustration. \
			Songs come with their artist, featuring artist, illustration and master track. \
			Videos come with their artist, illustration and master track. \
			Albums come with their artist and illustration.",
	})
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
	async search(@Query("query") query?: string) {
		if (!query) {
			throw new InvalidRequestException(
				"Expected non-empty 'query' query parameter",
			);
		}
		const items = await this.searchService.search(query);
		return Promise.all(
			items.map(async (item: any) => {
				if (item["groupId"] !== undefined) {
					if ("songId" in item) {
						return this.videoResponseBuilder.buildResponse(
							item as Video,
						);
					}
					return this.songResponseBuilder.buildResponse(item as Song);
				} else if (item["masterId"] !== undefined) {
					return this.albumResponseBuilder.buildResponse(
						item as unknown as AlbumWithRelations,
					);
				}
				return this.artistResponseBuilder.buildResponse(item as Artist);
			}),
		);
	}
}
