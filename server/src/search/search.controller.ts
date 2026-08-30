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
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AlbumResponseBuilder } from "src/album/models/album.response";
import { ArtistResponseBuilder } from "src/artist/models/artist.response";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { SongResponseBuilder } from "src/song/models/song.response";
import { VideoResponseBuilder } from "src/video/models/video.response";
import { SearchItemSchema } from "./models/search-item";
import { SearchService } from "./search.service";

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
		schema: SearchItemSchema,
	})
	async search(@Query("query") query?: string) {
		if (!query) {
			throw new InvalidRequestException(
				"Expected non-empty 'query' query parameter",
			);
		}
		const items = await this.searchService.search(query);
		return Promise.all(
			// biome-ignore lint: All cases are covered
			items.map(async ({ type, item }) => {
				switch (type) {
					case "video":
						return {
							type,
							item:
								await this.videoResponseBuilder.buildResponse(
									item,
								),
						};
					case "album":
						return {
							type,
							item:
								await this.albumResponseBuilder.buildResponse(
									item,
								),
						};
					case "song":
						return {
							type,
							item:
								await this.songResponseBuilder.buildResponse(
									item,
								),
						};
					case "artist":
						return {
							type,
							item:
								await this.artistResponseBuilder.buildResponse(
									item,
								),
						};
					case "label":
						return { type, item };
					case "genre":
						return { type, item };
					case "series":
						return { type, item };
				}
			}),
		);
	}
}
