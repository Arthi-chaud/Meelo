import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider, {
	AlbumMetadata, ArtistMetadata, SongMetadata
} from "../iprovider";
import GeniusSettings from "./genius.settings";
import SettingsService from "src/settings/settings.service";
import Slug from "src/slug/slug";
import levenshtein from "damerau-levenshtein";
import { ProviderActionFailedError } from "../provider.exception";
import { name, version } from 'package.json';
import { HttpService } from "@nestjs/axios";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getLyrics } = require('genius-lyrics-api');

@Injectable()
export default class GeniusProvider extends IProvider<GeniusSettings> implements OnModuleInit {
	constructor(
		private httpService: HttpService,
		private settingsService: SettingsService
	) {
		super("genius");
	}

	private async fetchAPI(route: string) {
		return this._fetch(route, 'https://api.genius.com')
			.then((res) => res.response);
	}

	/*private fetchWebPage(route: string) {
		return this._fetch(route, 'https://genius.com');
	}*/

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

	getArtistWikidataIdentifierProperty() {
		return "P2373";
	}

	getAlbumWikidataIdentifierProperty() {
		return "P6217";
	}

	getSongWikidataIdentifierProperty() {
		return "P6218";
	}

	async getArtistMetadataByIdentifier(artistIdentifier: string): Promise<ArtistMetadata> {
		try {
			const artistSearchResult = await this.getArtistBySlug(artistIdentifier);
			const artist = await this.fetchAPI('/artists/' + artistSearchResult.id).then((res) => res.artist);
			const descAnnotation = artist.description_annotation;
			const desc = this.parseDescriptionAnnotation(descAnnotation);

			return {
				value: artist.url.split('/').pop(),
				description: desc.length ? desc : null
			};
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistMetadataByIdentifier', err.message);
		}
	}

	async getArtistMetadataByName(artistName: string, songName?: string): Promise<ArtistMetadata> {
		try {
			const sluggedArtistName = new Slug(artistName).toString();
			const searchResults = await this.fetchAPI('/search?q=' + encodeURIComponent(this.sanitizeQuery(`${artistName} ${songName ?? ''}`)))
				.then((res) => res.hits.map((hit: any) => hit.result));

			const { url, id } = searchResults
				.map((song: any) => ({
					similarity: levenshtein(
						new Slug(song.primary_artist.name).toString(),
						sluggedArtistName
					).similarity,
					url: song.primary_artist.url
				}))
				.sort((artistA: any, artistB: any) => artistB.similarity - artistA.similarity)
				.at(0)!;
			const artist = await this.fetchAPI('/artists/' + id).then((res) => res.artist).catch(() => null);
			const descAnnotation = artist?.description_annotation;
			const desc = descAnnotation ? this.parseDescriptionAnnotation(descAnnotation) : null;

			return {
				description: desc?.length ? desc : null,
				value: url.split('/').pop() // Retrieves last past of URL
			};
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
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

	getArtistURL(artistIdentifier: string): string {
		return `${this.getProviderHomepage()}/artists/${artistIdentifier}`;
	}

	async getArtistIllustrationUrl(artistIdentifer: string): Promise<string> {
		const artist = await this.getArtistBySlug(artistIdentifer);

		if (artist.image_url.includes("default_avatar")) {
			throw new ProviderActionFailedError(this.name, 'getArtistIllustrationUrl', "No Image");
		}
		return artist.image_url;
	}

	async getAlbumMetadataByIdentifier(albumIdentifier: string): Promise<AlbumMetadata> {
		return {
			description: null,
			value: albumIdentifier
		};
	}

	async getSongMetadataByIdentifier(songIdentifer: string): Promise<SongMetadata> {
		return {
			description: null,
			value: songIdentifer
		};
	}

	async getSongMetadataByName(songName: string, artistIdentifer: string): Promise<SongMetadata> {
		try {
			const sluggedSongName = new Slug(songName).toString();
			const searchResults = await this.fetchAPI(`/search?q=${this.sanitizeQuery(songName)}`)
				.then((res) => res.hits.map((hit: any) => hit.result));
			const id = searchResults
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

			return {
				description: null,
				value: id
			};
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
	}

	getSongURL(songIdentifier: string): string {
		return `${this.getProviderHomepage()}/${songIdentifier}-lyrics`;
	}

	async getSongLyrics(songIdentifier: string): Promise<string> {
		const lyrics = await getLyrics(this.getSongURL(songIdentifier))
			.catch((error: any) => {
				throw new ProviderActionFailedError(this.name, 'getSongLyrics', error.message);
			});

		if (lyrics == null) {
			throw new ProviderActionFailedError(this.name, 'getSongLyrics', "No Lyrics Found");
		}
		return lyrics;
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
