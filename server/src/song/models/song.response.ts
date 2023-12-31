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
import { Song, SongWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ExternalIdResponse, {
	ExternalIdResponseBuilder,
} from "src/providers/models/external-id.response";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import {
	SongVersionResponse,
	SongVersionResponseBuilder,
} from "src/song-version/models/song-version.response";

export class SongResponse extends IntersectionType(
	Song,
	IllustratedResponse,
	class {
		artist?: ArtistResponse;
		versions?: SongVersionResponse[];
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
		@Inject(forwardRef(() => SongVersionResponseBuilder))
		private songVersionResponseBuilder: SongVersionResponseBuilder,
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
		if (song.versions !== undefined) {
			response.versions = await Promise.all(
				song.versions.map((version) =>
					this.songVersionResponseBuilder.buildResponse(version),
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
