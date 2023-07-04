import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse, ArtistResponseBuilder } from "src/artist/models/artist.response";
import { Album, AlbumWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ExternalIdResponse, { ExternalIdResponseBuilder } from "src/providers/models/external-id.response";
import IllustrationResponse from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";

export class AlbumResponse extends IntersectionType(
	Album,
	class {
		artist?: ArtistResponse | null;
		illustration: IllustrationResponse | null;
		externalIds?: ExternalIdResponse[];
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
			illustration: this.illustrationRepository.getAlbumIllustrationPath(album.id)
		};

		if (album.artist != undefined) {
			response.artist = await this.artistResponseBuilder.buildResponse(album.artist);
		}
		if (album.externalIds !== undefined) {
			response.externalIds = await Promise.all(
				album.externalIds?.map(
					(id) => this.externalIdResponseBuilder.buildResponse(id)
				) ?? []
			);
		}
		return response;
	}
}
