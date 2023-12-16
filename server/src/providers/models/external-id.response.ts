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

import { ApiProperty } from "@nestjs/swagger";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ProviderService from "../provider.service";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import ProviderResponse from "./provider.response";
import ExternalId from "./external-id";

export default class ExternalIdResponse {
	@ApiProperty({
		type: ProviderResponse,
		description: "External Provider",
	})
	provider: ProviderResponse;

	@ApiProperty({
		description: "Actual ID of the resource from the provider",
	})
	value: string;

	@ApiProperty({
		nullable: true,
		description: "Description of the resource, from the provider",
	})
	description: string | null;

	@ApiProperty({
		description: "Provider's URL to the resource",
		nullable: true,
	})
	url: string | null;
}

export class AlbumExternalIdResponse extends ExternalIdResponse {
	@ApiProperty({
		description: "Rating of the resource, from the provider",
		nullable: true,
	})
	rating: number | null;
}

@Injectable()
export class ExternalIdResponseBuilder extends ResponseBuilderInterceptor<
	ExternalId,
	ExternalIdResponse
> {
	constructor(
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
	) {
		super();
	}

	returnType = ExternalIdResponse;

	async buildResponse(externalId: ExternalId): Promise<ExternalIdResponse> {
		const provider = this.providerService.getProviderById(
			externalId.providerId,
		);
		let url: string | null = null;

		try {
			if ("artistId" in externalId) {
				url = provider.getArtistURL(externalId.value);
			} else if ("albumId" in externalId) {
				url = provider.getAlbumURL(externalId.value);
			} else if ("songId" in externalId) {
				url = provider.getSongURL(externalId.value);
			} else if ("releaseId" in externalId) {
				url = provider.getReleaseURL(externalId.value);
			}
		} catch {
			url = null;
		}

		const response = {
			provider: {
				name: provider.name,
				homepage: provider.getProviderHomepage(),
				banner: `/illustrations/providers/${provider.name}/banner`,
				icon: `/illustrations/providers/${provider.name}/icon`,
			},
			value: externalId.value,
			description: externalId.description,
			url: url,
		};

		if ("albumId" in externalId) {
			(response as AlbumExternalIdResponse).rating = externalId.rating;
		}
		return response;
	}
}
