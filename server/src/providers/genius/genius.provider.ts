import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider from "../iprovider";
import GeniusSettings from "./genius.settings";
import SettingsService from "src/settings/settings.service";
import Genius from 'genius-lyrics';
import Slug from "src/slug/slug";
import levenshtein from "damerau-levenshtein";
import { ProviderActionFailedError } from "../provider.exception";

@Injectable()
export default class GeniusProvider extends IProvider<GeniusSettings> implements OnModuleInit {
	private geniusClient: Genius.Client;
	constructor(
		private settingsService: SettingsService
	) {
		super("genius");
		this._settings = settingsService.settingsValues.providers.genius;
	}

	onModuleInit() {
		this._settings = this.settingsService.settingsValues.providers.genius;
		this.geniusClient = new Genius.Client(this._settings.apiKey);
	}

	getProviderBannerUrl(): string {
		return "https://t2.genius.com/unsafe/440x440/https:%2F%2Fimages.genius.com%2F1d88f9c0c8623d60cf6d85ad3b38a6de.999x999x1.png";
	}

	getProviderIconUrl(): string {
		return "https://images.genius.com/8ed669cadd956443e29c70361ec4f372.1000x1000x1.png";
	}

	async getArtistIdentifier(artistName: string, songName?: string | undefined): Promise<string> {
		try {
			const sluggedArtistName = new Slug(artistName).toString();
			const searchResults = await this.geniusClient.songs.search(`${artistName} ${songName ?? ''}`);

			return searchResults
				.map((song) => ({
					similarity: levenshtein(
						new Slug(song.artist.name).toString(),
						sluggedArtistName
					).similarity,
					id: song.artist.id
				}))
				.sort((artistA, artistB) => artistB.similarity - artistA.similarity)
				.at(0)!.id.toString();
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}
}
