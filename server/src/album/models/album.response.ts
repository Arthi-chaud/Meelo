import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse, ArtistResponseBuilder } from "src/artist/models/artist.response";
import {
	Album, AlbumWithRelations, Genre
} from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { AlbumExternalIdResponse, ExternalIdResponseBuilder } from "src/providers/models/external-id.response";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";

export class AlbumResponse extends IntersectionType(
	Album,
	IllustratedResponse,
	class {
		artist?: ArtistResponse | null;
		externalIds?: AlbumExternalIdResponse[];
		genres?: Genre[];
	}
) {}

@Injectable()
export class AlbumResponseBuilder extends ResponseBuilderInterceptor<AlbumWithRelations, AlbumResponse> {
	constructor(
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder
	) {
		super();
	}

	returnType = AlbumResponse;

	async buildResponse(album: AlbumWithRelations): Promise<AlbumResponse> {
		const response = <AlbumResponse>{
			...album,
			illustration: await this.illustrationRepository.getAlbumIllustration({ id: album.id })
		};

		if (album.artist != undefined) {
			response.artist = await this.artistResponseBuilder.buildResponse(album.artist);
		}
		if (album.externalIds !== undefined) {
			response.externalIds = await Promise.all(
				album.externalIds?.map(
					(id) => this.externalIdResponseBuilder.buildResponse(id)
				) ?? []
			) as AlbumExternalIdResponse[];
		}
		return response;
	}
}
