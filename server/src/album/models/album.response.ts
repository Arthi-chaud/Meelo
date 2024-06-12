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
import {
	ReleaseResponse,
	ReleaseResponseBuilder,
} from "src/release/models/release.response";
import ReleaseService from "src/release/release.service";
import Logger from "src/logger/logger";

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
	private readonly logger = new Logger(AlbumResponseBuilder.name);
	constructor(
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
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
		/// This should happen only during scans
		if (album.master === null) {
			this.logger.warn(
				"The Master Release of an album had to be resolved manually. " +
					"This should happen only during a scan or a clean. " +
					"If it is not the case, this is a bug.",
			);
			album.master = await this.releaseService.getMasterRelease({
				id: album.id,
			});
		}
		return {
			id: album.id,
			name: album.name,
			slug: album.slug,
			nameSlug: album.nameSlug,
			releaseDate: album.releaseDate,
			registeredAt: album.registeredAt,
			masterId: album.masterId,
			type: album.type,
			artistId: album.artistId,
			genres: album.genres,
			illustration: album.illustration
				? IllustrationResponse.from(album.illustration)
				: album.illustration,
			artist: album.artist
				? await this.artistResponseBuilder.buildResponse(album.artist)
				: album.artist,
			externalIds: album.externalIds
				? ((await Promise.all(
						album.externalIds.map((id) =>
							this.externalIdResponseBuilder.buildResponse(id),
						),
				  )) as AlbumExternalIdResponse[])
				: album.externalIds,
			master: album.master
				? await this.releaseResponseBuilder.buildResponse(album.master)
				: album.master,
		};
	}
}
