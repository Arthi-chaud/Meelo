import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import IllustrationService from "src/illustration/illustration.service";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Artist, ArtistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import Slug from "src/slug/slug";

export class ArtistResponse extends IntersectionType(
	Artist, IllustratedModel
) {}

@Injectable()
export class ArtistResponseBuilder extends ResponseBuilderInterceptor<ArtistWithRelations, ArtistResponse> {
	constructor(
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService
	) {
		super();
	}

	returnType = ArtistResponse;

	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		const response = <ArtistResponse>{
			...artist,
			illustration: this.illustrationService.getArtistIllustrationLink(new Slug(artist.slug))
		};

		return response;
	}
}
