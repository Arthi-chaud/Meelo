import {
	Inject, Injectable, OnModuleInit, forwardRef
} from "@nestjs/common";
import IProvider from "../iprovider";
import * as mb from "musicbrainz-api";
import {
	name as AppName, version as AppVersion, homepage as Homepage
} from 'package.json';
import SettingsService from "src/settings/settings.service";
import MusicBrainzSettings from "./musicbrainz.settings";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpService } from "@nestjs/axios";
import { AlbumType } from "@prisma/client";

type MBID = string;

@Injectable()
export default class MusicBrainzProvider extends IProvider<MusicBrainzSettings, MBID> implements OnModuleInit {
	private mbClient: mb.MusicBrainzApi;
	private readonly compilationArtistID = "89ad4ac3-39f7-470e-963a-56509c546377";

	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsSettings: SettingsService,
		private readonly httpService: HttpService
	) {
		super('musicbrainz');
	}

	onModuleInit() {
		this._settings = this.settingsSettings.settingsValues.providers.musicbrainz;
		this.mbClient = new mb.MusicBrainzApi({
			appName: AppName,
			appVersion: AppVersion,
			appContactInfo: Homepage
		});
	}

	getProviderHomepage(): string {
		return 'https://musicbrainz.org';
	}

	getProviderBannerUrl(): string {
		return "https://wiki.musicbrainz.org/images/a/a9/MusicBrainz_Logo_Transparent.png";
	}

	getProviderIconUrl(): string {
		return "https://s3-us-west-1.amazonaws.com/coppertino/vox-blog/artwork-musicbrainz.png";
	}

	async getArtistIdentifier(artistName: string, _songName?: string): Promise<MBID> {
		try {
			const searchResult = await this.mbClient.searchArtist({ query: artistName });

			return searchResult.artists.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}

	getArtistURL(artistIdentifier: MBID): string {
		return `${this.getProviderHomepage()}/artist/${artistIdentifier}`;
	}

	async getAlbumIdentifier(albumName: string, artistIdentifier?: string): Promise<MBID> {
		try {
			const searchResult = await this.mbClient.searchRelease({
				query: `query="${albumName}" AND arid:${artistIdentifier ?? this.compilationArtistID}`
			}).then((result) => result.releases
				.filter((release) => release["artist-credit"]?.find((artist) =>
					artist.artist.id == (artistIdentifier ?? this.compilationArtistID))));

			return searchResult.at(0)!["release-group"]!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumIdentifier', err.message);
		}
	}

	getAlbumURL(artistIdentifier: MBID): string {
		return `${this.getProviderHomepage()}/release-group/${artistIdentifier}`;
	}

	async getSongIdentifier(songName: string, artistIdentifier: string): Promise<string> {
		try {
			const results = await this.mbClient.search<mb.IIsrcSearchResult>(
				'recording',
				{ query: `query="${songName}" AND arid:${artistIdentifier}` }
			).then((result) => result.recordings
				.filter((recording) => recording["artist-credit"]
					?.find((artist) => artist.artist.id == artistIdentifier)));

			for (const recordingId of results.map(({ id }) => id)) {
				const recording = await this.mbClient.lookupRecording(recordingId, ['work-rels']);

				const workId = recording.relations?.map((relation) => {
					if ('work' in relation) {
						return (relation['work'] as { id: MBID }).id;
					}
					return undefined;
				}).find((value) => value);

				if (workId) {
					return workId;
				}
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getSongIdentifier', 'Song not found');
	}

	getSongURL(artistIdentifier: MBID): string {
		return `${this.getProviderHomepage()}/work/${artistIdentifier}`;
	}

	async getSongGenres(songIdentifier: MBID): Promise<string[]> {
		try {
			const recordings = await this.mbClient
				.browseEntity<{ recordings: mb.IRecording & { genres: { name: string }[] }[]}>('recording', {
					work: songIdentifier,
					inc: 'genres'
				}).then((res) => res.recordings);
			const genres = recordings.map((recording) => recording.genres).flat();

			// Stripping other members
			return genres.map(({ name }) => name);
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongGenres', err.message);
		}
	}

	async getAlbumDescription(albumIdentifer: MBID): Promise<string> {
		try {
			const album = await this.mbClient.lookupReleaseGroup(albumIdentifer, ['url-rels']);
			const externalUrls = (album as mb.IReleaseGroup & mb.IRelationList).relations;
			const wikipediaId = externalUrls
				.find((resource) => resource.type == 'wikipedia')?.url
				?.resource
				?.split('/').pop();
			const wikidataId = externalUrls
				.find((resource) => resource.type == 'wikidata')?.url
				?.resource
				?.split('/').pop();

			return await this.getWikipediaDescription(
				wikidataId && !wikipediaId
					? await this.getWikipediaArticleName(wikidataId)
					: wikipediaId!
			);
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumDescription', err.message);
		}
	}

	async getAlbumType(albumIdentifer: MBID): Promise<AlbumType> {
		try {
			const album = await this.mbClient.lookupReleaseGroup(albumIdentifer);
			const primaryType: string | undefined = album['primary-type'];
			const secondaryTypes: string[] = (album as any)['secondary-types'] ?? [];

			if (secondaryTypes.length == 0) {
				switch (primaryType) {
				case "Album":
					return AlbumType.StudioRecording;
				case "EP":
				case "Single":
					return AlbumType.Single;
				case "Broadcast":
					return AlbumType.LiveRecording;
				default:
					break;
				}
			}
			// https://musicbrainz.org/release-group/ce018797-8764-34f8-aee4-10089fc7393d
			if (!primaryType && secondaryTypes.includes("Remix")) {
				return AlbumType.RemixAlbum;
			}
			if (primaryType == "Album") {
				// https://musicbrainz.org/release-group/a1b16f9c-7b93-3351-9453-0f3545a5f989
				if (secondaryTypes.includes("Remix")) {
					return AlbumType.RemixAlbum;
				}
				// https://musicbrainz.org/release-group/35f4c727-8b32-3457-a2e7-42a697dd39c2
				if (secondaryTypes.includes("Compilation")) {
					return AlbumType.Compilation;
				}
				if (secondaryTypes.includes("Live")) {
					return AlbumType.LiveRecording;
				}
				if (secondaryTypes.includes("Soundtrack")) {
					return AlbumType.Soundtrack;
				}
			}
			if (primaryType == "Single") {
				return AlbumType.Single;
			}
			if (primaryType == "EP") {
				if (secondaryTypes.includes("Compilation")) {
					return AlbumType.Compilation;
				}
				return AlbumType.Single;
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumDescription', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getAlbumDescription', "Album Type unknown");
	}

	async getArtistDescription(artistIdentifier: MBID): Promise<string> {
		try {
			const artist = await this.mbClient.lookupArtist(artistIdentifier, ['url-rels']);
			const externalUrls = (artist as mb.IArtist & mb.IRelationList).relations;
			const wikipediaId = externalUrls
				.map((relation) => relation.url?.resource)
				.find((url) => url?.includes('wikipedia'))!.split('/').pop()!;

			return await this.getWikipediaDescription(wikipediaId);
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistDescription', err.message);
		}
	}

	private async getWikipediaArticleName(wikidataId: string): Promise<string> {
		const wikidataResponse = await this.httpService.axiosRef.get(
			'/w/api.php',
			{
				baseURL: 'https://www.wikidata.org',
				params: {
					action: 'wbgetentities',
					props: 'sitelinks',
					ids: wikidataId,
					sitefilter: 'enwiki',
					format: 'json'
				}
			}
		).then(({ data }) => data);

		return (Object.entries(wikidataResponse.entities)
			.at(0)![1] as any)
			.sitelinks.enwiki.title;
	}

	private async getWikipediaDescription(resourceId: string): Promise<string> {
		const wikipediaResponse = await this.httpService.axiosRef.get(
			'/w/api.php',
			{
				baseURL: 'https://en.wikipedia.org',
				params: {
					format: 'json',
					action: 'query',
					prop: 'extracts',
					exintro: true,
					explaintext: true,
					redirects: 1,
					titles: decodeURIComponent(resourceId)
				}
			}
		).then(({ data }) => data);

		return (Object
			.entries(wikipediaResponse.query.pages)
			.at(0)![1] as { extract: string })
			.extract.trim();
	}
}
