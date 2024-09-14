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

export default class ExternalMetadataResponse {
	@ApiProperty({
		type: ProviderResponse,
		description: "External Provider",
	})
	provider: ProviderResponse;

	@ApiProperty({
		nullable: true,
		description: "Description of the resource, from the provider",
	})
	description: string | null;

	@ApiProperty()
	sources: ExternalMetadataSourceResponse[];
}

export class AlbumExternalMetadataResponse extends ExternalMetadataResponse {
	@ApiProperty({
		description: "Rating of the resource, from the provider",
		nullable: true,
	})
	rating: number | null;
}

class ExternalMetadataSourceResponse {
	@ApiProperty()
	providerId: number;
	@ApiProperty()
	providerName: number;
	@ApiProperty({
		nullable: true,
	})
	providerIcon: string | null;
	@ApiProperty()
	url: string;
}

@Injectable()
export class ExternalMetadataResponseBuilder extends ResponseBuilderInterceptor<
	ExternalId,
	ExternalMetadataResponse
> {
	constructor(
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
	) {
		super();
	}

	returnType = ExternalMetadataResponse;

	async buildResponse(
		externalId: ExternalId,
	): Promise<ExternalMetadataResponse> {
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

		const response: ExternalMetadataResponse = {
			sources: {},
			provider: {
				name: provider.name,
				homepage: provider.getProviderHomepage(),
				icon: `/illustrations/providers/${provider.name}/icon`,
			},
			description: externalId.description,
		};

		if ("albumId" in externalId) {
			(response as AlbumExternalMetadataResponse).rating =
				externalId.rating;
		}
		return response;
	}
}
