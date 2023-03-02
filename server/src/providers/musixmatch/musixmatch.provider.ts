import { Injectable } from "@nestjs/common";
import IProvider from "../iprovider";
import MusixMatchSettings from "./musixmatch.settings";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpService } from "@nestjs/axios";
import * as cheerio from 'cheerio';
import Slug from "src/slug/slug";
import levenshtein from 'damerau-levenshtein';

@Injectable()
export default class MusixMatchProvider extends IProvider<MusixMatchSettings> {
	constructor(
		protected readonly httpService: HttpService,
	) {
		super('musixmatch');
	}

	getProviderBannerUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Musixmatch_compact_logo_on_white.svg/566px-Musixmatch_compact_logo_on_white.svg.png";
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Musixmatch_logo_icon_only.svg/480px-Musixmatch_logo_icon_only.svg.png";
	}

	private rootUrl = 'https://www.musixmatch.com/';

	async getArtistIdentifier(artistName: string, _songName?: string | undefined): Promise<string> {
		try {
			const sluggedArtistName = new Slug(artistName).toString();
			const searchPage = await this.httpService.axiosRef
				.get(`/search/${artistName}/artists`, { baseURL: this.rootUrl });
			const searchResults = cheerio.load(searchPage.data)('.media-card-title');
			const candidates = searchResults
				.map((__, element) => {
					const link = cheerio.load(element)('.cover');

					return {
						id: link.attr()!['href'].replace('/artist/', ''),
						name: link.text()
					};
				}).toArray();

			return candidates
				.map((elem) => ({
					...elem,
					similarity: levenshtein(
						new Slug(elem.name).toString(),
						sluggedArtistName
					).similarity
				}))
				.sort((candidateA, candidateB) => candidateB.similarity - candidateA.similarity)
				.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}

	async getArtistIllustrationUrl(artistIdentifer: string): Promise<string> {
		try {
			const artistPage = await this.httpService.axiosRef
				.get(`/artist/${artistIdentifer}`, { baseURL: this.rootUrl });
			const avatarContainer = cheerio.load(artistPage.data)('.profile-avatar');
			const avatarUrl = avatarContainer.attr()!['src'];

			if (avatarUrl.includes('avatar-placeholder')) {
				throw new ProviderActionFailedError(this.name, 'getArtistIllustrationUrl', "No Avatar");
			}
			return avatarUrl;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIllustrationUrl', err.message);
		}
	}
}
