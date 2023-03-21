import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider from "../iprovider";
import GeniusSettings from "./genius.settings";
import SettingsService from "src/settings/settings.service";
import Slug from "src/slug/slug";
import levenshtein from "damerau-levenshtein";
import { ProviderActionFailedError } from "../provider.exception";
import { name, version } from 'package.json';
import { HttpService } from "@nestjs/axios";
import * as cheerio from 'cheerio';

@Injectable()
export default class GeniusProvider extends IProvider<GeniusSettings, string> implements OnModuleInit {
	constructor(
		private httpService: HttpService,
		private settingsService: SettingsService
	) {
		super("genius");
	}

	private fetchAPI(route: string) {
		return this._fetch(route, 'https://api.genius.com')
			.then((res) => res.response);
	}

	private fetchWebPage(route: string) {
		return this._fetch(route, 'https://genius.com');
	}

	private _fetch(route: string, baseURL: string) {
		const accessToken = process.env.NODE_ENV == 'test'
			? process.env.GENIUS_ACCESS_TOKEN
			: this._settings.apiKey;

		return this.httpService.axiosRef.get(route, {
			baseURL, headers: {
				"Authorization": "Bearer " + accessToken,
				"User-Agent": `${name}, ${version}`
			}
		}).then((res) => res.data);
	}

	// Thanks to https://github.com/farshed/genius-lyrics-api/blob/9634a6e99b8b0f96cf82a53e8f1ff13d2d604b8e/lib/utils/index.js#L11
	private sanitizeQuery(query: string) {
		return query
			.toLowerCase()
			.replace(/ *\([^)]*\) */g, "")
			.replace(/ *\[[^\]]*]/, "")
			.replace(/feat\.|ft\./g, "")
			.replace(/\s+/g, " ")
			.trim();
	}

	onModuleInit() {
		this._settings = this.settingsService.settingsValues.providers.genius;
	}

	getProviderHomepage(): string {
		return 'https://genius.com';
	}

	getProviderBannerUrl(): string {
		return "https://t2.genius.com/unsafe/440x440/https:%2F%2Fimages.genius.com%2F1d88f9c0c8623d60cf6d85ad3b38a6de.999x999x1.png";
	}

	getProviderIconUrl(): string {
		return "https://images.genius.com/8ed669cadd956443e29c70361ec4f372.1000x1000x1.png";
	}

	private async getArtistBySlug(artistIdentifer: string): Promise<any> {
		const searchResults = await this.fetchAPI('/search?q=' + artistIdentifer)
			.then((res) => res.hits.map((hit: any) => hit.result));

		const res = searchResults
			.map((song: any) => song.primary_artist)
			.find((artist: any) => artist.url.split('/').pop() == artistIdentifer);

		if (!res) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', 'Invalid Value');
		}
		return res;
	}

	private async getSongBySlug(songIdentifier: string): Promise<any> {
		const searchResults = await this.fetchAPI('/search?q=' + songIdentifier)
			.then((res) => res.hits.map((hit: any) => hit.result));

		return searchResults
			.find((song: any) => song.url.split('/').pop().replace('-lyrics', '') == songIdentifier)!;
	}

	private async getAlbumBySlug(albumSlug: string): Promise<any> {
		const albumPage = await this.fetchWebPage(`/albums/${albumSlug}`);
		const id = albumPage.match(/api_path&quot;:&quot;\/albums\/(?<id>\d+)&quot;/)!.groups!['id']!;

		return this.fetchAPI('/albums/' + id).then((res) => res.album);
	}

	async getArtistIdentifier(artistName: string, songName?: string): Promise<string> {
		try {
			const sluggedArtistName = new Slug(artistName).toString();
			const searchResults = await this.fetchAPI('/search?q=' + this.sanitizeQuery(`${artistName} ${songName ?? ''}`))
				.then((res) => res.hits.map((hit: any) => hit.result));

			return searchResults
				.map((song: any) => ({
					similarity: levenshtein(
						new Slug(song.primary_artist.name).toString(),
						sluggedArtistName
					).similarity,
					url: song.primary_artist.url
				}))
				.sort((artistA: any, artistB: any) => artistB.similarity - artistA.similarity)
				.at(0)!.url.split('/').pop(); // Retrieves last past of URL
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}

	getArtistURL(artistIdentifier: string): string {
		return `${this.getProviderHomepage()}/artists/${artistIdentifier}`;
	}

	async getSongIdentifier(songName: string, artistIdentifer: string): Promise<string> {
		try {
			const sluggedSongName = new Slug(songName).toString();
			const searchResults = await this.fetchAPI(`/search?q=${this.sanitizeQuery(songName)}`)
				.then((res) => res.hits.map((hit: any) => hit.result));

			return searchResults
				.filter((song: any) => song.primary_artist.url.endsWith('/' + artistIdentifer))
				.map((song: any) => ({
					similarity: levenshtein(
						new Slug(song.title).toString(),
						sluggedSongName
					).similarity,
					url: song.url
				}))
				.sort((songA: any, songB: any) => songB.similarity - songA.similarity)
				.at(0)!.url.split('/').pop().replace('-lyrics', ''); // Retrieves last past of URL
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
	}

	getSongURL(songIdentifier: string): string {
		return `${this.getProviderHomepage()}/${songIdentifier}-lyrics`;
	}

	async getArtistIllustrationUrl(artistIdentifer: string): Promise<string> {
		const artist = await this.getArtistBySlug(artistIdentifer);

		if (artist.image_url.includes("default_avatar")) {
			throw new ProviderActionFailedError(this.name, 'getArtistIllustrationUrl', "No Image");
		}
		return artist.image_url;
	}

	async getSongLyrics(songIdentifier: string): Promise<string> {
		try {
			const song = await this.getSongBySlug(songIdentifier);
			const songPage = await this.fetchWebPage(song.path);
			const parsedPage = cheerio.load(songPage);
			// Inspired by https://github.com/zyrouge/node-genius-lyrics/blob/8499a0aeb91fd5eba296f96c19a24db28a2177d5/lib/songs/song.ts#L76
			const primaryLyricsContainer = parsedPage(".lyrics").text().trim();

			if (primaryLyricsContainer.length) {
				return primaryLyricsContainer;
			}
			const secondaryLyricsContainer = parsedPage("div[class*='Lyrics__Container']")
				.toArray()
				.map((lyricContainer: any) => {
					const parsedLyrics = parsedPage(lyricContainer as any);

					parsedLyrics.find("br").replaceWith("\n");
					return parsedLyrics.text();
				})
				.join("\n")
				.trim();

			if (secondaryLyricsContainer.length) {
				return secondaryLyricsContainer;
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongLyrics', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getSongLyrics', "No Lyrics Found");
	}

	async getArtistDescription(artistIdentifer: string): Promise<string> {
		try {
			const artistSearchResult = await this.getArtistBySlug(artistIdentifer);
			const artist = await this.fetchAPI('/artists/' + artistSearchResult.id).then((res) => res.artist);
			const descAnnotation = artist.description_annotation;
			const desc = this.parseDescriptionAnnotation(descAnnotation);

			if (desc.length) {
				return desc;
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistDescription', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getArtistDescription', "No Description Found");
	}

	async getAlbumDescription(albumIdentifer: string): Promise<string> {
		try {
			const album = await this.getAlbumBySlug(albumIdentifer);
			const descAnnotation = album.description_annotation;
			const desc = this.parseDescriptionAnnotation(descAnnotation);

			if (desc.length) {
				return desc;
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumDescription', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getAlbumDescription', "No Description Found");
	}

	async getAlbumIdentifier(albumName: string, artistIdentifier?: string): Promise<string> {
		if (!artistIdentifier) {
			throw new ProviderActionFailedError(this.name, 'getAlbumDescription', 'Artist Identifier is Required');
		}
		try {
			const artist = await this.getArtistBySlug(artistIdentifier);
			const sluggedAlbumName = new Slug(albumName).toString();
			const albumListPage = await this.fetchWebPage('/artists/albums?for_artist_page=' + artist.id)
				.then((content) => cheerio.load(content));
			const albumList = albumListPage('.album_link')
				.map((__, child) => {
					const parsedChild = cheerio.load(child);
					const slug = new Slug(parsedChild.text()).toString();
					const similiary = levenshtein(
						slug, sluggedAlbumName
					).similarity;

					return {
						slug,
						similiary,
						link: child.attribs['href'],
					};
				})
				.toArray()
				.sort((albumA, albumB) => albumB.similiary - albumA.similiary);
			const firstMatch = albumList.at(0);

			if (firstMatch && firstMatch.similiary > 0.7) {
				return firstMatch.link.replace('/albums/', '');
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumIdentifier', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getAlbumIdentifier', "Album Not Found");
	}

	getAlbumURL(albumIdentifier: string): string {
		return `${this.getProviderHomepage()}/albums/${albumIdentifier}`;
	}

	private parseDescriptionAnnotation(descriptionAnnotation: any): string {
		return descriptionAnnotation.annotations
			.map((annotation: any) => {
				const parser = (child: any): string => {
					if (typeof child == 'string') {
						return child;
					}
					if (child.children) {
						return child.children.map(parser).join(' ').replaceAll('  ', ' ');
					}
					return "";
				};

				return parser(annotation.body.dom);
			})
			.join('\n').replaceAll('\n\n', '\n');
	}
}
