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
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import { Track, type TrackWithRelations } from "src/prisma/models";
import {
	type ReleaseResponse,
	ReleaseResponseBuilder,
} from "src/release/models/release.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	type SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";
import {
	type VideoResponse,
	VideoResponseBuilder,
} from "src/video/models/video.response";

export class TrackResponse extends IntersectionType(
	class extends OmitType(Track, [
		"thumbnailId",
		"standaloneIllustrationId",
	]) {},
	IllustratedResponse,
	class {
		song?: SongResponse | null;
		video?: VideoResponse | null;
		release?: ReleaseResponse | null;
	},
) {}

@Injectable()
export class TrackResponseBuilder extends ResponseBuilderInterceptor<
	TrackWithRelations,
	TrackResponse
> {
	constructor(
		@Inject(forwardRef(() => VideoResponseBuilder))
		private videoResponseBuilder: VideoResponseBuilder,
		@Inject(forwardRef(() => ReleaseResponseBuilder))
		private releaseResponseBuilder: ReleaseResponseBuilder,
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
	) {
		super();
	}

	returnType = TrackResponse;

	async buildResponse(track: TrackWithRelations): Promise<TrackResponse> {
		return {
			id: track.id,
			songId: track.songId,
			mixed: track.mixed,
			videoId: track.videoId,
			releaseId: track.releaseId,
			name: track.name,
			discIndex: track.discIndex,
			discName: track.discName,
			trackIndex: track.trackIndex,
			type: track.type,
			bitrate: track.bitrate,
			ripSource: track.ripSource,
			duration: track.duration,
			isBonus: track.isBonus,
			isRemastered: track.isRemastered,
			sourceFileId: track.sourceFileId,
			video: track.video
				? await this.videoResponseBuilder.buildResponse(track.video)
				: track.video,
			song: track.song
				? await this.songResponseBuilder.buildResponse(track.song)
				: track.song,
			release: track.release
				? await this.releaseResponseBuilder.buildResponse(track.release)
				: track.release,
			illustration: track.illustration
				? IllustrationResponse.from(track.illustration)
				: track.illustration,
		};
	}
}
