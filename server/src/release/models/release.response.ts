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
	type AlbumResponse,
	AlbumResponseBuilder,
} from "src/album/models/album.response";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import { Release, type ReleaseWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

export class ReleaseResponse extends IntersectionType(
	Release,
	IllustratedResponse,
	class {
		album?: AlbumResponse;
	},
) {}

@Injectable()
export class ReleaseResponseBuilder extends ResponseBuilderInterceptor<
	ReleaseWithRelations,
	ReleaseResponse
> {
	constructor(
		@Inject(forwardRef(() => AlbumResponseBuilder))
		private albumResponseBuilder: AlbumResponseBuilder,
	) {
		super();
	}

	returnType = ReleaseResponse;

	async buildResponse(
		release: ReleaseWithRelations,
	): Promise<ReleaseResponse> {
		return {
			id: release.id,
			name: release.name,
			extensions: release.extensions,
			slug: release.slug,
			nameSlug: release.nameSlug,
			releaseDate: release.releaseDate,
			albumId: release.albumId,
			registeredAt: release.registeredAt,
			album: release.album
				? await this.albumResponseBuilder.buildResponse(release.album)
				: release.album,
			illustration: release.illustration
				? IllustrationResponse.from(release.illustration)
				: release.illustration,
		};
	}
}
