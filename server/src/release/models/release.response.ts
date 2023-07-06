import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { AlbumResponse, AlbumResponseBuilder } from "src/album/models/album.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import { Release, ReleaseWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

export class ReleaseResponse extends IntersectionType(
	Release,
	IllustratedResponse,
	class {
		album?: AlbumResponse;
	}
) {}

@Injectable()
export class ReleaseResponseBuilder extends ResponseBuilderInterceptor<ReleaseWithRelations, ReleaseResponse> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => AlbumResponseBuilder))
		private albumResponseBuilder: AlbumResponseBuilder
	) {
		super();
	}

	returnType = ReleaseResponse;

	async buildResponse(release: ReleaseWithRelations): Promise<ReleaseResponse> {
		const response = <ReleaseResponse>{
			...release,
			illustration: await this.illustrationRepository
				.getReleaseIllustration({ id: release.id })
		};

		if (release.album !== undefined) {
			response.album = await this.albumResponseBuilder.buildResponse(release.album);
		}
		return response;
	}
}
