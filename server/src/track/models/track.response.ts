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
			illustration:
				await this.illustrationRepository.getTrackIllustration({
					id: track.id,
				}),
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
