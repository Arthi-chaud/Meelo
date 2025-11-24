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

import { Injectable } from "@nestjs/common";
import { IntersectionType, OmitType } from "@nestjs/swagger";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import { Artist, type ArtistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

export class ArtistResponse extends IntersectionType(
	OmitType(Artist, ["sortSlug"]),
	IllustratedResponse,
) {}

@Injectable()
export class ArtistResponseBuilder extends ResponseBuilderInterceptor<
	ArtistWithRelations,
	ArtistResponse
> {
	returnType = ArtistResponse;

	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		return {
			id: artist.id,
			name: artist.name,
			slug: artist.slug,
			sortName: artist.sortName,
			registeredAt: artist.registeredAt,
			illustrationId: artist.illustrationId,
			illustration: artist.illustration
				? IllustrationResponse.from(artist.illustration)
				: artist.illustration,
		};
	}
}
