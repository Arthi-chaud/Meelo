import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse, ArtistResponseBuilder } from "src/artist/models/artist.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Album, AlbumWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import AlbumIllustrationService from "../album-illustration.service";

export class AlbumResponse extends IntersectionType(
	IntersectionType(
		Album, IllustratedModel
	),
	class {
		artist?: ArtistResponse | null;
	}
) {}

@Injectable()
export class AlbumResponseBuilder extends ResponseBuilderInterceptor<AlbumWithRelations, AlbumResponse> {
	constructor(
		@Inject(forwardRef(() => AlbumIllustrationService))
		private albumIllustrationService: AlbumIllustrationService,
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder
	) {
		super();
	}

	returnType = AlbumResponse;

	async buildResponse(album: AlbumWithRelations): Promise<AlbumResponse> {
		const response = <AlbumResponse>{
			...album,
			illustration: this.albumIllustrationService.buildIllustrationLink(album.id)
		};

		if (album.artist != undefined) {
			response.artist = await this.artistResponseBuilder.buildResponse(album.artist);
		}
		return response;
	}
}
