import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider, { AlbumMetadata } from "../iprovider";
import MetacriticSettings from "./metacritic.settings";
import { HttpService } from "@nestjs/axios";
import { ProviderActionFailedError } from "../provider.exception";
import { isNumber } from "class-validator";
import * as cheerio from 'cheerio';
import SettingsService from "src/settings/settings.service";

@Injectable()
export default class MetacriticProvider extends IProvider<MetacriticSettings> implements OnModuleInit {
	constructor(
		private readonly httpService: HttpService,
		private settingsService: SettingsService
	) {
		super('metacritic');
	}

	onModuleInit() {
		this._settings = this.settingsService.settingsValues.providers.metacritic;
	}

	getProviderHomepage(): string {
		return 'https://www.metacritic.com';
	}

	getProviderBannerUrl(): string {
		return 'https://upload.wikimedia.org/wikipedia/commons/4/48/Metacritic_logo.svg';
	}

	getProviderIconUrl(): string {
		return 'https://iconape.com/wp-content/files/hk/120653/png/Metacritic_logo_original.png';
	}

	getAlbumWikidataIdentifierProperty() {
		return "P1712";
	}

	getAlbumURL(albumIdentifier: string): string {
		return `${this.getProviderHomepage()}/master/${albumIdentifier}`;
	}

	async getAlbumMetadataByIdentifier(albumIdentifier: string): Promise<AlbumMetadata> {
		try {
			const albumPage = await this.httpService.axiosRef
				.get(`/${albumIdentifier}`, { baseURL: this.getProviderHomepage() })
				.then((res) => res.data);
			const pageSkeleton = cheerio.load(albumPage);
			const score = parseInt(pageSkeleton('span[itemprop="ratingValue"]').first().text());
			const description = pageSkeleton('span[itemprop=description]').first().text();

			return {
				value: albumIdentifier,
				rating: isNumber(score) ? score : null,
				description: description ?? null
			};
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumMetadataByIdentifier', err.message);
		}
	}
}
