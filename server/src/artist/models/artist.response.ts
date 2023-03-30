import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Artist, ArtistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ArtistIllustrationService from "../artist-illustration.service";
import ExternalIdResponse, { ExternalIdResponseBuilder } from "src/providers/models/external-id.response";

export class ArtistResponse extends IntersectionType(
	IntersectionType(
		Artist, IllustratedModel,
	),
	class {
		externalIds?: ExternalIdResponse[];
	}
) {}

@Injectable()
export class ArtistResponseBuilder extends ResponseBuilderInterceptor<ArtistWithRelations, ArtistResponse> {
	constructor(
		@Inject(forwardRef(() => ArtistIllustrationService))
		private artistIllustrationService: ArtistIllustrationService,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder
	) {
		super();
	}

	returnType = ArtistResponse;

	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		const response = <ArtistResponse>{
			...artist,
			illustration: this.artistIllustrationService.buildIllustrationLink(artist.id)
		};

		if (artist.externalIds !== undefined) {
			response.externalIds = await Promise.all(
				artist.externalIds?.map(
					(id) => this.externalIdResponseBuilder.buildResponse(id)
				) ?? []
			);
		}

		return response;
	}
}
