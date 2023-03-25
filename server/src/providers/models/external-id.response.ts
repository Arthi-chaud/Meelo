import { ApiProperty } from "@nestjs/swagger";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import ProviderService from "../provider.service";
import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import ProviderResponse from "./provider.response";
import ExternalId from "./external-id";

export default class ExternalIdResponse {
	@ApiProperty({
		type: ProviderResponse,
		description: 'External Provider'
	})
	provider: ProviderResponse;

	@ApiProperty({
		description: 'Actual ID of the resource from the provider'
	})
	value: string;

	@ApiProperty({
		description: "Provider's URL to the resource",
		nullable: true
	})
	url: string | null;
}

@Injectable()
export class ExternalIdResponseBuilder extends ResponseBuilderInterceptor<ExternalId, ExternalIdResponse> {
	constructor(
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService
	) {
		super();
	}

	returnType = ExternalIdResponse;

	async buildResponse(externalId: ExternalId): Promise<ExternalIdResponse> {
		const provider = this.providerService.getProviderById(externalId.providerId);
		let url: string | null = null;

		try {
			if ('artistId' in externalId) {
				url = provider.getArtistURL(externalId.value);
			} else if ('albumId' in externalId) {
				url = provider.getAlbumURL(externalId.value);
			} else if ('songId' in externalId) {
				url = provider.getSongURL(externalId.value);
			}
		} catch {
			url = null;
		}

		return {
			provider: {
				name: provider.name,
				homepage: provider.getProviderHomepage(),
				banner: provider.getProviderBannerUrl(),
				icon: provider.getProviderIconUrl(),
			},
			value: externalId.value,
			url: url
		};
	}
}
