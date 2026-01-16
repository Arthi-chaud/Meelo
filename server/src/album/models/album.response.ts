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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IntersectionType, OmitType } from "@nestjs/swagger";
import {
	type ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import {
	LocalIdentifiersResponse,
	ResponseWithLocalIdentifiers,
} from "src/local-identifiers/local-identifiers.response";
import { Album, type AlbumWithRelations, type Genre } from "src/prisma/models";
import {
	type ReleaseResponse,
	ReleaseResponseBuilder,
} from "src/release/models/release.response";
import ReleaseService from "src/release/release.service";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

export class AlbumResponse extends IntersectionType(
	OmitType(Album, ["sortSlug", "nameSlug"]),
	IllustratedResponse,
	ResponseWithLocalIdentifiers,
	class {
		artist?: ArtistResponse | null;
		master?: ReleaseResponse;
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
		@Inject(forwardRef(() => ReleaseResponseBuilder))
		private releaseResponseBuilder: ReleaseResponseBuilder,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
	) {
		super();
	}

	returnType = AlbumResponse;

	async buildResponse(album: AlbumWithRelations): Promise<AlbumResponse> {
		if (album.master === null) {
			album.master = await this.releaseService.getMasterRelease({
				id: album.id,
			});
		}
		return {
			id: album.id,
			name: album.name,
			slug: album.slug,
			sortName: album.sortName,
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
			master: album.master
				? await this.releaseResponseBuilder.buildResponse(album.master)
				: album.master,
			localIdentifiers: LocalIdentifiersResponse.from(
				album.localIdentifiers,
			),
		};
	}
}
