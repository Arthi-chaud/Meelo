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
import { Track, Video, VideoWithRelations } from "src/prisma/models";
import {
	ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";

export class VideoResponse extends IntersectionType(Video) {
	@ApiProperty()
	track: TrackResponse;
	@ApiProperty()
	artist?: ArtistResponse;
	@ApiProperty()
	song?: SongResponse | null;
}

@Injectable()
export class VideoResponseBuilder extends ResponseBuilderInterceptor<
	VideoWithRelations & { track: Track },
	VideoResponse
> {
	constructor(
		private songResponseBuilder: SongResponseBuilder,
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
	) {
		super();
	}

	returnType = VideoResponse;

	async buildResponse(
		video: VideoWithRelations & { track: Track },
	): Promise<VideoResponse> {
		return {
			...video,
			artist: video.artist
				? await this.artistResponseBuilder.buildResponse(video.artist)
				: video.artist,
			song: video.song
				? await this.songResponseBuilder.buildResponse(video.song)
				: video.song,
			track: await this.trackResponseBuilder.buildResponse(video.track),
		};
	}
}
