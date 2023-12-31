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
import { SongVersion, SongVersionWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";

export class SongVersionResponse extends IntersectionType(
	SongVersion,
	IllustratedResponse,
	class {
		song?: SongResponse;
		featuring?: ArtistResponse[];
	},
) {}

@Injectable()
export class SongVersionResponseBuilder extends ResponseBuilderInterceptor<
	SongVersionWithRelations,
	SongVersionResponse
> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
	) {
		super();
	}

	returnType = SongVersionResponse;

	async buildResponse(
		version: SongVersionWithRelations,
	): Promise<SongVersionResponse> {
		const response = <SongVersionResponse>{
			...version,
			illustration:
				await this.illustrationRepository.getSongVersionIllustration({
					id: version.id,
				}),
		};

		if (version.song !== undefined) {
			response.song = await this.songResponseBuilder.buildResponse(
				version.song,
			);
		}
		if (version.featuring !== undefined) {
			response.featuring = await Promise.all(
				version.featuring.map((artist) =>
					this.artistResponseBuilder.buildResponse(artist),
				),
			);
		}
		return response;
	}
}
