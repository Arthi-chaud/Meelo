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
import { IntersectionType } from "@nestjs/swagger";
import { Track, TrackWithRelations } from "src/prisma/models";
import {
	ReleaseResponse,
	ReleaseResponseBuilder,
} from "src/release/models/release.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import { IllustrationType } from "@prisma/client";

export class TrackResponse extends IntersectionType(
	Track,
	IllustratedResponse,
	class {
		song?: SongResponse;
		release?: ReleaseResponse;
	},
) {}

@Injectable()
export class TrackResponseBuilder extends ResponseBuilderInterceptor<
	TrackWithRelations,
	TrackResponse
> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ReleaseResponseBuilder))
		private releaseResponseBuilder: ReleaseResponseBuilder,
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
	) {
		super();
	}

	returnType = TrackResponse;

	async buildResponse(track: TrackWithRelations): Promise<TrackResponse> {
		const response = <TrackResponse>{
			...track,
			illustration: {
				...(await this.illustrationRepository.getTrackIllustration({
					id: track.id,
				})),
				type: IllustrationType.Cover,
			},
			stream: `/files/${track.sourceFileId}/stream`,
		};

		if (track.release !== undefined) {
			response.release = await this.releaseResponseBuilder.buildResponse(
				track.release,
			);
		}
		if (track.song != undefined) {
			response.song = await this.songResponseBuilder.buildResponse(
				track.song,
			);
		}
		return response;
	}
}
