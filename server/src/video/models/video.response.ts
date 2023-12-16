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
