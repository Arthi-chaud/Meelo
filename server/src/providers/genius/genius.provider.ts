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
export default class GeniusProvider extends IProvider<GeniusSettings, number> implements OnModuleInit {
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

	getProviderBannerUrl(): string {
		return "https://t2.genius.com/unsafe/440x440/https:%2F%2Fimages.genius.com%2F1d88f9c0c8623d60cf6d85ad3b38a6de.999x999x1.png";
	}

	getProviderIconUrl(): string {
		return "https://images.genius.com/8ed669cadd956443e29c70361ec4f372.1000x1000x1.png";
	}

	async getArtistIdentifier(artistName: string, songName?: string): Promise<number> {
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
					id: song.primary_artist.id
				}))
				.sort((artistA: any, artistB: any) => artistB.similarity - artistA.similarity)
				.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}

	async getSongIdentifier(songName: string, artistIdentifer: number): Promise<number> {
		try {
			const sluggedSongName = new Slug(songName).toString();
			const searchResults = await this.fetchAPI(`/search?q=${this.sanitizeQuery(songName)}`)
				.then((res) => res.hits.map((hit: any) => hit.result));

			return searchResults
				.filter((song: any) => song.primary_artist.id == artistIdentifer)
				.map((song: any) => ({
					similarity: levenshtein(
						new Slug(song.title).toString(),
						sluggedSongName
					).similarity,
					id: song.id
				}))
				.sort((songA: any, songB: any) => songB.similarity - songA.similarity)
				.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
	}

	async getArtistIllustrationUrl(artistIdentifer: number): Promise<string> {
		const artist = await this.fetchAPI(`/artists/${artistIdentifer}`).catch((err) => {
			throw new ProviderActionFailedError(this.name, 'getArtistIllustrationUrl', err.message);
		}).then((res) => res.artist);

		if (artist.image_url.includes("default_avatar")) {
			throw new ProviderActionFailedError(this.name, 'getArtistIllustrationUrl', "No Image");
		}
		return artist.image_url;
	}

	async getSongLyrics(songIdentifier: number): Promise<string> {
		try {
			const song = await this.fetchAPI(`/songs/${songIdentifier}`).catch((err) => {
				throw new ProviderActionFailedError(this.name, 'getSongLyrics', err.message);
			}).then((res) => res.song);
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

	async getArtistDescription(artistIdentifer: number): Promise<string> {
		try {
			const artist = await this.fetchAPI('/artists/' + artistIdentifer).then((res) => res.artist);
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

	async getAlbumDescription(albumIdentifer: number): Promise<string> {
		try {
			const album = await this.fetchAPI('/albums/' + albumIdentifer).then((res) => res.album);
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

	async getAlbumIdentifier(albumName: string, artistIdentifier?: number): Promise<number> {
		if (!artistIdentifier) {
			throw new ProviderActionFailedError(this.name, 'getAlbumDescription', 'Artist Identifier is Required');
		}
		try {
			const sluggedAlbumName = new Slug(albumName).toString();
			const albumListPage = await this.fetchWebPage('/artists/albums?for_artist_page=' + artistIdentifier)
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
				const albumPage: string = await this.fetchWebPage(firstMatch.link);

				return +albumPage.match(/api_path&quot;:&quot;\/albums\/(?<id>\d+)&quot;/)!.groups!['id']!;
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumDescription', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getAlbumDescription', "Album Not Found");
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
