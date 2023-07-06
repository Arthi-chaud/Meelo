import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import { Artist, ArtistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ExternalIdResponse, { ExternalIdResponseBuilder } from "src/providers/models/external-id.response";
import IllustrationRepository from "src/illustration/illustration.repository";

export class ArtistResponse extends IntersectionType(
	Artist,
	IllustratedResponse,
	class {
		externalIds?: ExternalIdResponse[];
	}
) {}

@Injectable()
export class ArtistResponseBuilder extends ResponseBuilderInterceptor<ArtistWithRelations, ArtistResponse> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder
	) {
		super();
	}

	returnType = ArtistResponse;

	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		const response = <ArtistResponse>{
			...artist,
			illustration: await this.illustrationRepository
				.getArtistIllustration({ id: artist.id })
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
