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

import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import Response from "src/response/response.decorator";
import { SearchAllResponseBuilder } from "./models/search-all.response";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import GenreService from "src/genre/genre.service";
import SongService from "src/song/song.service";

@ApiTags("Search")
@Controller("search")
export default class SearchController {
	constructor(
		private artistService: ArtistService,
		private albumService: AlbumService,
		private songService: SongService,
		private genreService: GenreService,
	) {}

	@ApiOperation({
		summary: "Search items by their names",
	})
	@Response({ handler: SearchAllResponseBuilder })
	@Get(":query")
	async searchItems(
		@Param("query")
		query: string,
	) {
		return {
			artists: await this.artistService.search(query, {}),
			albums: await this.albumService.search(query, {}),
			songs: await this.songService.search(query, {}),
			genres: await this.genreService.getMany({
				slug: { contains: query },
			}),
		};
	}
}
