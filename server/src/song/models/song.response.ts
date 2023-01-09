import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse, ArtistResponseBuilder } from "src/artist/models/artist.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Song, SongWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import SongIllustrationService from "../song-illustration.service";

export class SongResponse extends IntersectionType(
	IntersectionType(
		Song, IllustratedModel
	),
	class {
		artist?: ArtistResponse;
	}
) {}

@Injectable()
export class SongResponseBuilder extends ResponseBuilderInterceptor<SongWithRelations, SongResponse> {
	constructor(
		@Inject(forwardRef(() => SongIllustrationService))
		private songIllustrationService: SongIllustrationService,
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
	) {
		super();
	}

	returnType = SongResponse;

	async buildResponse(song: SongWithRelations): Promise<SongResponse> {
		const response = <SongResponse>{
			...song,
			illustration: await this.songIllustrationService.getIllustrationLink({ id: song.id })
		};

		if (song.artist !== undefined) {
			response.artist = await this.artistResponseBuilder.buildResponse(song.artist);
		}
		return response;
	}
}
