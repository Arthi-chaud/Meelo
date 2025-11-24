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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IntersectionType, OmitType } from "@nestjs/swagger";
import {
	type ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import Logger from "src/logger/logger";
import { Video, type VideoWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	type TrackResponse,
	TrackResponseBuilder,
} from "src/track/models/track.response";
import TrackService from "src/track/track.service";
import {
	type SongResponse,
	SongResponseBuilder,
} from "../../song/models/song.response";

export class VideoResponse extends IntersectionType(
	OmitType(Video, ["sortSlug"]),
	IllustratedResponse,
	class {
		master?: TrackResponse;
		artist?: ArtistResponse;
		song?: SongResponse | null;
	},
) {}

@Injectable()
export class VideoResponseBuilder extends ResponseBuilderInterceptor<
	VideoWithRelations,
	VideoResponse
> {
	private readonly logger = new Logger(VideoResponseBuilder.name);
	constructor(
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
	) {
		super();
	}

	returnType = VideoResponse;

	async buildResponse({
		sortSlug,
		...video
	}: VideoWithRelations): Promise<VideoResponse> {
		if (video.master === null) {
			this.logger.warn(
				"The Master Track of a video had to be resolved manually. " +
					"This should happen only during a scan or a clean. " +
					"If it is not the case, this is a bug.",
			);
			video.master = await this.trackService.getVideoMasterTrack({
				id: video.id,
			});
		}
		return {
			...video,
			artist: video.artist
				? await this.artistResponseBuilder.buildResponse(video.artist)
				: video.artist,
			song: video.song
				? await this.songResponseBuilder.buildResponse({
						...video.song,
						featuring: undefined,
					})
				: video.song,
			illustration: video.illustration
				? IllustrationResponse.from(video.illustration)
				: video.illustration,
			master: video.master
				? await this.trackResponseBuilder.buildResponse(video.master)
				: undefined,
		};
	}
}
