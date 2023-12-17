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
import { LyricsWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";

export class LyricsResponse {
	@ApiProperty({
		description:
			"A new-line-separated string, representing the lyrics of a song",
	})
	lyrics: string;

	song?: SongResponse;
}

@Injectable()
export class LyricsResponseBuilder extends ResponseBuilderInterceptor<
	LyricsWithRelations,
	LyricsResponse
> {
	constructor(
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
	) {
		super();
	}

	returnType = LyricsResponse;

	async buildResponse(input: LyricsWithRelations): Promise<LyricsResponse> {
		const response: LyricsResponse = { lyrics: input.content };

		if (input.song) {
			response.song = await this.songResponseBuilder.buildResponse(
				input.song,
			);
		}
		return response;
	}
}
