import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { AlbumResponse, AlbumResponseBuilder } from "src/album/models/album.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Release, ReleaseWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ReleaseIllustrationService from "../release-illustration.service";

export class ReleaseResponse extends IntersectionType(
	IntersectionType(
		Release, IllustratedModel
	),
	class {
		album?: AlbumResponse;
	}
) {}

@Injectable()
export class ReleaseResponseBuilder extends ResponseBuilderInterceptor<ReleaseWithRelations, ReleaseResponse> {
	constructor(
		private releaseIllustrationService: ReleaseIllustrationService,
		@Inject(forwardRef(() => AlbumResponseBuilder))
		private albumResponseBuilder: AlbumResponseBuilder
	) {
		super();
	}

	returnType = ReleaseResponse;

	async buildResponse(release: ReleaseWithRelations): Promise<ReleaseResponse> {
		const response = <ReleaseResponse>{
			...release,
			illustration: await this.releaseIllustrationService
				.getIllustrationLink({ id: release.id })
		};

		if (release.album !== undefined) {
			response.album = await this.albumResponseBuilder.buildResponse(release.album);
		}
		return response;
	}
}
