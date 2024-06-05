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
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import { Artist, ArtistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ExternalIdResponse, {
	ExternalIdResponseBuilder,
} from "src/providers/models/external-id.response";
import IllustrationRepository from "src/illustration/illustration.repository";

export class ArtistResponse extends IntersectionType(
	Artist,
	IllustratedResponse,
	class {
		externalIds?: ExternalIdResponse[];
	},
) {}

@Injectable()
export class ArtistResponseBuilder extends ResponseBuilderInterceptor<
	ArtistWithRelations,
	ArtistResponse
> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ExternalIdResponseBuilder))
		private externalIdResponseBuilder: ExternalIdResponseBuilder,
	) {
		super();
	}

	returnType = ArtistResponse;

	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		const response = <ArtistResponse>{
			...artist,
			illustration:
				artist.illustrationId === null
					? null
					: await this.illustrationRepository
							.getIllustration(artist.illustrationId)
							.then(
								(value) =>
									value && IllustrationResponse.from(value),
							),
		};

		if (artist.externalIds !== undefined) {
			response.externalIds = await Promise.all(
				artist.externalIds?.map((id) =>
					this.externalIdResponseBuilder.buildResponse(id),
				) ?? [],
			);
		}

		return response;
	}
}
