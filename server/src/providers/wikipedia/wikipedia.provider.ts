import { Inject, Injectable, OnModuleInit, forwardRef } from "@nestjs/common";
import IProvider from "../iprovider";
import WikipediaSettings from "./wikipedia.settings";
import SettingsService from "src/settings/settings.service";
import { HttpService } from "@nestjs/axios";
import { ProviderActionFailedError } from "../provider.exception";

@Injectable()
export default class WikipediaProvider
	extends IProvider<WikipediaSettings>
	implements OnModuleInit
{
	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsSettings: SettingsService,
		private readonly httpService: HttpService,
	) {
		super("wikipedia");
	}

	onModuleInit() {
		this._settings =
			this.settingsSettings.settingsValues.providers.wikipedia;
	}

	getProviderBannerUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Wikipedia_wordmark.svg/2880px-Wikipedia_wordmark.svg.png";
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/5/52/Wp_globe_VIG_13.png";
	}

	getProviderHomepage(): string {
		return "https://en.wikipedia.org";
	}

	async getResourceMetadataByWikidataId(resourceWikidataId: string) {
		try {
			const wikidataArticleName =
				await this.getWikipediaArticleName(resourceWikidataId);
			const description = await this.getWikipediaDescription(
				wikidataArticleName,
			).catch(() => null);

			return { value: wikidataArticleName, description };
		} catch {
			throw new ProviderActionFailedError(
				this.name,
				"getResourceMetadataByWikidataId",
				"Artist not found",
			);
		}
	}

	getArtistURL(artistIdentifier: string): string | null {
		return this.getResourceUrl(artistIdentifier);
	}

	getAlbumURL(albumIdentifer: string): string | null {
		return this.getResourceUrl(albumIdentifer);
	}

	getSongURL(songIdentifer: string): string | null {
		return this.getResourceUrl(songIdentifer);
	}

	private getResourceUrl(articleName: string) {
		return `https://en.wikipedia.org/wiki/${articleName}`;
	}

	private async getWikipediaArticleName(wikidataId: string): Promise<string> {
		const wikidataResponse = await this.httpService.axiosRef
			.get("/w/api.php", {
				baseURL: "https://www.wikidata.org",
				params: {
					action: "wbgetentities",
					props: "sitelinks",
					ids: wikidataId,
					sitefilter: "enwiki",
					format: "json",
				},
			})
			.then(({ data }) => data);

		return (Object.entries(wikidataResponse.entities).at(0)![1] as any)
			.sitelinks.enwiki.title;
	}

	private async getWikipediaDescription(resourceId: string): Promise<string> {
		const wikipediaResponse = await this.httpService.axiosRef
			.get("/w/api.php", {
				baseURL: "https://en.wikipedia.org",
				params: {
					format: "json",
					action: "query",
					prop: "extracts",
					exintro: true,
					explaintext: true,
					redirects: 1,
					titles: decodeURIComponent(resourceId),
				},
			})
			.then(({ data }) => data);

		const stringifiedData = (
			Object.entries(wikipediaResponse.query.pages).at(0)![1] as {
				extract: string;
			}
		).extract.trim();

		if (stringifiedData.startsWith("Undefined may refer")) {
			throw new ProviderActionFailedError(
				this.name,
				"getWikipediaDescription",
				"No description found",
			);
		}
		return stringifiedData;
	}
}
