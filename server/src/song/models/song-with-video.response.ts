import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { TrackResponse, TrackResponseBuilder } from "src/track/models/track.response";
import { SongResponse, SongResponseBuilder } from "./song.response";
import { Song, Track } from "src/prisma/models";

export class SongWithVideoResponse extends IntersectionType(
	SongResponse,
	class {
		video: TrackResponse;
	}
) {}

@Injectable()
export class SongWithVideoResponseBuilder extends ResponseBuilderInterceptor<Song & { video: Track }, SongWithVideoResponse> {
	constructor(
		private songResponseBuilder: SongResponseBuilder,
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
	) {
		super();
	}

	returnType = SongWithVideoResponse;

	async buildResponse(song: SongWithVideoResponse): Promise<SongWithVideoResponse> {
		return {
			...await this.songResponseBuilder.buildResponse(song),
			video: await this.trackResponseBuilder.buildResponse(song.video)
		};
	}
}
