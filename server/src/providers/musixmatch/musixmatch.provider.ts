/*
import { Injectable } from "@nestjs/common";
import IProvider from "../iprovider";
import MusixMatchSettings from "./musixmatch.settings";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpService } from "@nestjs/axios";
import * as cheerio from 'cheerio';
import Slug from "src/slug/slug";
import levenshtein from 'damerau-levenshtein';

@Injectable()
export default class MusixMatchProvider extends IProvider<MusixMatchSettings, string> {
	constructor(
		protected readonly httpService: HttpService,
	) {
		super('musixmatch');
	}

	getProviderHomepage(): string {
		return 'https://www.musixmatch.com';
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

	getArtistURL(artistIdentifier: string): string {
		return `${this.getProviderHomepage()}/artist/${artistIdentifier}`;
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

	async getSongIdentifier(songName: string, artistIdentifer: string): Promise<string> {
		try {
			const sluggedSongName = new Slug(songName).toString();
			const searchPage = await this.httpService.axiosRef
				.get(`/search/${artistIdentifer} ${songName}/tracks`, { baseURL: this.rootUrl });
			const searchResults = cheerio.load(searchPage.data)('.media-card');

			return searchResults
				.map((__, element) => {
					const parsedElement = cheerio.load(element);
					const title = parsedElement('.title');
					const artist = parsedElement('.artist');

					return {
						id: title.attr()!['href'].replace('/lyrics/', ''),
						name: title.text(),
						artistId: artist.attr()!['href'].replace('/artist/', ''),
					};
				}).toArray()
				.filter(({ artistId }) => artistId == artistIdentifer)
				.map((track) => ({
					...track,
					similarity: levenshtein(
						new Slug(track.name).toString(),
						sluggedSongName
					).similarity
				}))
				.sort((candidateA, candidateB) => candidateB.similarity - candidateA.similarity)
				.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
	}

	getSongURL(songIdentifier: string): string {
		return `${this.getProviderHomepage()}/lyrics/${songIdentifier}`;
	}

	async getSongLyrics(songIdentifier: string): Promise<string> {
		try {
			const lyricsPage = await this.httpService.axiosRef
				.get(`/lyrics/${songIdentifier}`, { baseURL: this.rootUrl });
			const lyrics = cheerio.load(lyricsPage.data)('.lyrics__content__ok')
				.map((__, lyricSegment) => cheerio.load(lyricSegment).text())
				.toArray()
				.join('\n')
				.trim();

			if (!lyrics.length) {
				throw new Error("No lyrics found");
			}
			return lyrics;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongLyrics', err.message);
		}
	}
}
*/
