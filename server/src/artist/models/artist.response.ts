import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Artist, ArtistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ArtistIllustrationService from "../artist-illustration.service";

export class ArtistResponse extends IntersectionType(
	Artist, IllustratedModel
) {}

@Injectable()
export class ArtistResponseBuilder extends ResponseBuilderInterceptor<ArtistWithRelations, ArtistResponse> {
	constructor(
		@Inject(forwardRef(() => ArtistIllustrationService))
		private artistIllustrationService: ArtistIllustrationService
	) {
		super();
	}

	returnType = ArtistResponse;

	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		const response = <ArtistResponse>{
			...artist,
			illustration: this.artistIllustrationService.buildIllustrationLink(artist.id)
		};

		return response;
	}
}
