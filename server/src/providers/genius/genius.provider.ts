import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider from "../iprovider";
import GeniusSettings from "./genius.settings";
import SettingsService from "src/settings/settings.service";
import * as Genius from 'genius-lyrics';
import Slug from "src/slug/slug";
import levenshtein from "damerau-levenshtein";
import { ProviderActionFailedError } from "../provider.exception";

@Injectable()
export default class GeniusProvider extends IProvider<GeniusSettings, number> implements OnModuleInit {
	private geniusClient: Genius.Client;
	constructor(
		private settingsService: SettingsService
	) {
		super("genius");
	}

	onModuleInit() {
		this._settings = this.settingsService.settingsValues.providers.genius;
		this.geniusClient = new Genius.Client(
			process.env.NODE_ENV == 'test' ? process.env.GENIUS_ACCESS_TOKEN : this._settings.apiKey
		);
	}

	getProviderBannerUrl(): string {
		return "https://t2.genius.com/unsafe/440x440/https:%2F%2Fimages.genius.com%2F1d88f9c0c8623d60cf6d85ad3b38a6de.999x999x1.png";
	}

	getProviderIconUrl(): string {
		return "https://images.genius.com/8ed669cadd956443e29c70361ec4f372.1000x1000x1.png";
	}

	async getArtistIdentifier(artistName: string, songName?: string): Promise<number> {
		try {
			const sluggedArtistName = new Slug(artistName).toString();
			const searchResults = await this.geniusClient.songs.search(
				`${artistName} ${songName ?? ''}`,
				{ sanitizeQuery: true }
			);

			return searchResults
				.map((song) => ({
					similarity: levenshtein(
						new Slug(song.artist.name).toString(),
						sluggedArtistName
					).similarity,
					id: song.artist.id
				}))
				.sort((artistA, artistB) => artistB.similarity - artistA.similarity)
				.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}

	async getSongIdentifier(songName: string, artistIdentifer: number): Promise<number> {
		try {
			const sluggedSongName = new Slug(songName).toString();
			const searchResults = await this.geniusClient.songs.search(
				songName,
				{ sanitizeQuery: true }
			);

			return searchResults
				.filter((song) => song.artist.id == artistIdentifer)
				.map((song) => ({
					similarity: levenshtein(
						new Slug(song.title).toString(),
						sluggedSongName
					).similarity,
					id: song.id
				}))
				.sort((songA, songB) => songB.similarity - songA.similarity)
				.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
	}

	async getArtistIllustrationUrl(artistIdentifer: number): Promise<string> {
		const artist = await this.geniusClient.artists.get(artistIdentifer).catch((err) => {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		});

		if (artist.image.includes("default_avatar")) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', "No Image");
		}
		return artist.image;
	}

	async getSongLyrics(songIdentifier: number): Promise<string> {
		try {
			const song = await this.geniusClient.songs.get(songIdentifier);

			return await song.lyrics();
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongLyrics', err);
		}
	}
}
