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

import type { Track } from "src/prisma/models";
import { TrackResponse, TrackResponseBuilder } from "./track.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { Inject, Injectable, forwardRef } from "@nestjs/common";

/**
 * Index to use if the disc index is unknown
 */
export const UnknownDiscIndexKey = "?" as const;

type Tracklist<T extends Track = Track> = Map<string, T[]>;
export default Tracklist;

@Injectable()
export class TracklistResponseBuilder extends ResponseBuilderInterceptor<
	Tracklist<Track>,
	Tracklist<TrackResponse>
> {
	constructor(
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
	) {
		super();
	}

	returnType = Map<number | typeof UnknownDiscIndexKey, Track>;

	async buildResponse(
		tracklist: Tracklist<Track>,
	): Promise<Record<string, TrackResponse>> {
		let response = {};

		for (const [disc, tracks] of tracklist) {
			response = {
				...response,
				[disc]: await Promise.all(
					tracks.map((track) =>
						this.trackResponseBuilder.buildResponse(track),
					),
				),
			};
		}
		return response;
	}
}
