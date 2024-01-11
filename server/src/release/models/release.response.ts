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
	AlbumResponse,
	AlbumResponseBuilder,
} from "src/album/models/album.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import { Release, ReleaseWithRelations } from "src/prisma/models";
import ExternalIdResponse, {
	ExternalIdResponseBuilder,
} from "src/providers/models/external-id.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

export class ReleaseResponse extends IntersectionType(
	Release,
	IllustratedResponse,
	class {
		album?: AlbumResponse;
		externalIds?: ExternalIdResponse[];
	},
) {}

@Injectable()
export class ReleaseResponseBuilder extends ResponseBuilderInterceptor<
	ReleaseWithRelations,
	ReleaseResponse
> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => AlbumResponseBuilder))
		private albumResponseBuilder: AlbumResponseBuilder,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder,
	) {
		super();
	}

	returnType = ReleaseResponse;

	async buildResponse(
		release: ReleaseWithRelations,
	): Promise<ReleaseResponse> {
		const response = <ReleaseResponse>{
			...release,
			illustration:
				await this.illustrationRepository.getReleaseIllustrationResponse(
					{
						id: release.id,
					},
				),
		};

		if (release.album !== undefined) {
			response.album = await this.albumResponseBuilder.buildResponse(
				release.album,
			);
		}
		if (release.externalIds !== undefined) {
			response.externalIds = await Promise.all(
				release.externalIds?.map((id) =>
					this.externalIdResponseBuilder.buildResponse(id),
				) ?? [],
			);
		}
		return response;
	}
}
