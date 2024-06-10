/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import {
	ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import { Album, AlbumWithRelations, Genre } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	AlbumExternalIdResponse,
	ExternalIdResponseBuilder,
} from "src/providers/models/external-id.response";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import {
	ReleaseResponse,
	ReleaseResponseBuilder,
} from "src/release/models/release.response";
import ReleaseService from "src/release/release.service";

export class AlbumResponse extends IntersectionType(
	Album,
	IllustratedResponse,
	class {
		artist?: ArtistResponse | null;
		master?: ReleaseResponse;
		externalIds?: AlbumExternalIdResponse[];
		genres?: Genre[];
	},
) {}

@Injectable()
export class AlbumResponseBuilder extends ResponseBuilderInterceptor<
	AlbumWithRelations,
	AlbumResponse
> {
	constructor(
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder,
		@Inject(forwardRef(() => ReleaseResponseBuilder))
		private releaseResponseBuilder: ReleaseResponseBuilder,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
	) {
		super();
	}

	returnType = AlbumResponse;

	async buildResponse(album: AlbumWithRelations): Promise<AlbumResponse> {
		const response = <AlbumResponse>{
			...album,
			illustration: album.illustration
				? IllustrationResponse.from(album.illustration)
				: album.illustration,
		};

		if (album.artist != undefined) {
			response.artist = await this.artistResponseBuilder.buildResponse(
				album.artist,
			);
		}
		if (album.master === null) {
			album.master = await this.releaseService.getMasterRelease({
				id: album.id,
			});
		}
		if (album.master !== undefined) {
			response.master = await this.releaseResponseBuilder.buildResponse(
				album.master,
			);
		}
		if (album.externalIds !== undefined) {
			response.externalIds = (await Promise.all(
				album.externalIds?.map((id) =>
					this.externalIdResponseBuilder.buildResponse(id),
				) ?? [],
			)) as AlbumExternalIdResponse[];
		}
		return response;
	}
}
