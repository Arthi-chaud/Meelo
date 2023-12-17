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
import { Song, Track } from "src/prisma/models";

export class VideoResponse extends IntersectionType(SongResponse) {
	@ApiProperty()
	track: TrackResponse;
}

@Injectable()
export class VideoResponseBuilder extends ResponseBuilderInterceptor<
	Song & { track: Track },
	VideoResponse
> {
	constructor(
		private songResponseBuilder: SongResponseBuilder,
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
	) {
		super();
	}

	returnType = VideoResponse;

	async buildResponse(song: Song & { track: Track }): Promise<VideoResponse> {
		return {
			...(await this.songResponseBuilder.buildResponse(song)),
			track: await this.trackResponseBuilder.buildResponse(song.track),
		};
	}
}
