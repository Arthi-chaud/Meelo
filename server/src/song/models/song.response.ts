import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import {
	ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import { Song, SongWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ExternalIdResponse, {
	ExternalIdResponseBuilder,
} from "src/providers/models/external-id.response";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";

export class SongResponse extends IntersectionType(
	Song,
	IllustratedResponse,
	class {
		artist?: ArtistResponse;
		featuring?: ArtistResponse[];
		externalIds?: ExternalIdResponse[];
	},
) {}

@Injectable()
export class SongResponseBuilder extends ResponseBuilderInterceptor<
	SongWithRelations,
	SongResponse
> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder,
	) {
		super();
	}

	returnType = SongResponse;

	async buildResponse(song: SongWithRelations): Promise<SongResponse> {
		const response = <SongResponse>{
			...song,
			illustration: await this.illustrationRepository.getSongIllustration(
				{ id: song.id },
			),
		};

		if (song.artist !== undefined) {
			response.artist = await this.artistResponseBuilder.buildResponse(
				song.artist,
			);
		}
		if (song.featuring !== undefined) {
			response.featuring = await Promise.all(
				song.featuring.map((artist) =>
					this.artistResponseBuilder.buildResponse(artist),
				),
			);
		}
		if (song.externalIds !== undefined) {
			response.externalIds = await Promise.all(
				song.externalIds?.map((id) =>
					this.externalIdResponseBuilder.buildResponse(id),
				) ?? [],
			);
		}
		return response;
	}
}
