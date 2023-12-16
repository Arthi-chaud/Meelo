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

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import {
	AlbumResponse,
	AlbumResponseBuilder,
} from "src/album/models/album.response";
import {
	ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";
import SearchController from "../search.controller";
import { Genre } from "src/prisma/models";

export type SearchAllReturnType = Awaited<
	ReturnType<SearchController["searchItems"]>
>;

export class SearchAllResponse {
	@ApiProperty({
		isArray: true,
		type: () => ArtistResponse,
	})
	artists: ArtistResponse[];

	@ApiProperty({
		isArray: true,
		type: () => AlbumResponse,
	})
	albums: AlbumResponse[];

	@ApiProperty({
		isArray: true,
		type: () => SongResponse,
	})
	songs: SongResponse[];

	@ApiProperty({
		isArray: true,
		type: () => Genre,
	})
	genres: Genre[];
}

@Injectable()
export class SearchAllResponseBuilder extends ResponseBuilderInterceptor<
	SearchAllReturnType,
	SearchAllResponse
> {
	constructor(
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => AlbumResponseBuilder))
		private albumResponseBuilder: AlbumResponseBuilder,
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
	) {
		super();
	}

	returnType = SearchAllResponse;

	async buildResponse(
		input: SearchAllReturnType,
	): Promise<SearchAllResponse> {
		return {
			artists: await Promise.all(
				input.artists.map((artist) =>
					this.artistResponseBuilder.buildResponse(artist),
				),
			),
			albums: await Promise.all(
				input.albums.map((album) =>
					this.albumResponseBuilder.buildResponse(album),
				),
			),
			songs: await Promise.all(
				input.songs.map((song) =>
					this.songResponseBuilder.buildResponse(song),
				),
			),
			genres: input.genres,
		};
	}
}
