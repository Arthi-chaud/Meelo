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
import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	TrackResponse,
	TrackResponseBuilder,
} from "src/track/models/track.response";
import {
	SongResponse,
	SongResponseBuilder,
} from "../../song/models/song.response";
import { Song, SongVersion, Track } from "src/prisma/models";
import {
	SongVersionResponse,
	SongVersionResponseBuilder,
} from "src/song-version/models/song-version.response";

export class VideoResponse extends IntersectionType(SongVersionResponse) {
	@ApiProperty()
	track: TrackResponse;
	@ApiProperty()
	song: SongResponse;
}

@Injectable()
export class VideoResponseBuilder extends ResponseBuilderInterceptor<
	SongVersion & { track: Track; song: Song },
	VideoResponse
> {
	constructor(
		private songResponseBuilder: SongResponseBuilder,
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
		@Inject(forwardRef(() => SongVersionResponseBuilder))
		private songVersionResponseBuilder: SongVersionResponseBuilder,
	) {
		super();
	}

	returnType = VideoResponse;

	async buildResponse(
		song: SongVersion & { track: Track; song: Song },
	): Promise<VideoResponse> {
		return {
			...(await this.songVersionResponseBuilder.buildResponse(song)),
			// Song will alaways be defined, see definition of Video
			track: await this.trackResponseBuilder.buildResponse(song.track),
		} as VideoResponse;
	}
}
