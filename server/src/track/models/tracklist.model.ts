import type { Track } from "src/prisma/models";
import { TrackResponse, TrackResponseBuilder } from "./track.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";

/**
 * Index to use if the disc index is unknown
 */
export const UnknownDiscIndexKey = '?' as const;

type Tracklist<T extends Track = Track> = Map<string, T[]>;
export default Tracklist;

@Injectable()
export class TracklistResponseBuilder extends ResponseBuilderInterceptor<Tracklist<Track>, Tracklist<TrackResponse>> {
	constructor(
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder
	) {
		super();
	}

	returnType = Map<number | typeof UnknownDiscIndexKey, Track>;

	async buildResponse(tracklist: Tracklist<Track>): Promise<Record<string, TrackResponse>> {
		let response = {};

		for (const [disc, tracks] of tracklist) {
			response = {
				...response,
				[disc]: await Promise.all(
					tracks.map((track) => this.trackResponseBuilder.buildResponse(track))
				)
			};
		}
		return response;
	}
}
