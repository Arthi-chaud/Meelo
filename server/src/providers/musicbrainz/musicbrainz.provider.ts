import {
	Inject, Injectable, OnModuleInit, forwardRef
} from "@nestjs/common";
import IProvider, {
	AlbumMetadata, ArtistMetadata, SongMetadata
} from "../iprovider";
import * as mb from "musicbrainz-api";
import {
	name as AppName, version as AppVersion, homepage as Homepage
} from 'package.json';
import SettingsService from "src/settings/settings.service";
import MusicBrainzSettings from "./musicbrainz.settings";
import { ProviderActionFailedError } from "../provider.exception";

type MBID = string;

@Injectable()
export default class MusicBrainzProvider extends IProvider<MusicBrainzSettings> implements OnModuleInit {
	private mbClient: mb.MusicBrainzApi;
	private readonly compilationArtistID = "89ad4ac3-39f7-470e-963a-56509c546377";

	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsSettings: SettingsService
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

	/**
	 * Looks up an artist, and returns the entity, along with its relations URLs
	 */
	async getArtistEntry(artistIdentifier: MBID) {
		return this.mbClient.lookupArtist(artistIdentifier, ['url-rels']);
	}

	async getArtistMetadataByIdentifier(artistIdentifier: string): Promise<ArtistMetadata> {
		return {
			description: null,
			value: artistIdentifier
		};
	}

	async getArtistMetadataByName(artistName: string): Promise<ArtistMetadata> {
		// Note: It's not possible to get url-rels using search. So we can not do everything in one query.
		try {
			const artist = (await this.mbClient.searchArtist({ query: artistName })).artists.at(0)!;

			return this.getArtistMetadataByIdentifier(artist.id);
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistDescription', err.message);
		}
	}

	/**
	 * Looks up an album, and returns the entity, along with its relations URLs
	 */
	async getAlbumEntry(albumIdentifer: MBID) {
		return this.mbClient.lookupReleaseGroup(albumIdentifer, ['url-rels']);
	}

	/**
	 * Looks up a song, and returns the entity, along with its relations URLs
	 */
	async getSongEntry(songIdentifier: MBID) {
		return this.mbClient.lookupWork(songIdentifier, ['url-rels']);
	}

	getArtistURL(artistIdentifier: MBID): string {
		return `${this.getProviderHomepage()}/artist/${artistIdentifier}`;
	}

	async getAlbumMetadataByName(
		albumName: string, artistIdentifier?: string
	): Promise<AlbumMetadata> {
		try {
			const searchResult = await this.mbClient.searchRelease({
				query: `query="${albumName}" AND arid:${artistIdentifier ?? this.compilationArtistID}`
			}).then((result) => result.releases
				.filter((release) => release["artist-credit"]?.find((artist) =>
					artist.artist.id == (artistIdentifier ?? this.compilationArtistID))));

			return this.getAlbumMetadataByIdentifier(searchResult.at(0)!["release-group"]!.id);
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getAlbumIdentifier', err.message);
		}
	}

	async getAlbumMetadataByIdentifier(albumIdentifer: MBID): Promise<AlbumMetadata> {
		return { description: null, value: albumIdentifer };
	}

	getAlbumURL(albumIdentifier: MBID): string {
		return `${this.getProviderHomepage()}/release-group/${albumIdentifier}`;
	}

	async getSongMetadataByName(songName: string, artistIdentifier: string): Promise<SongMetadata> {
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
					return this
						.getSongMetadataByIdentifier(workId)
						.catch(() => ({ value: workId, description: null }));
				}
			}
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getSongIdentifier', err.message);
		}
		throw new ProviderActionFailedError(this.name, 'getSongIdentifier', 'Song not found');
	}

	async getSongMetadataByIdentifier(songIdentifier: string): Promise<SongMetadata> {
		return {
			description: null,
			value: songIdentifier
		};
	}

	getSongURL(artistIdentifier: MBID): string {
		return `${this.getProviderHomepage()}/work/${artistIdentifier}`;
	}

	// async getSongGenres(songIdentifier: MBID): Promise<string[]> {
	// 	try {
	// 		const recordings = await this.mbClient
	// 			.browseEntity<{ recordings: mb.IRecording & { genres: { name: string }[] }[]}>('recording', {
	// 				work: songIdentifier,
	// 				inc: 'genres'
	// 			}).then((res) => res.recordings);
	// 		const genres = recordings.map((recording) => recording.genres).flat();

	// 		// Stripping other members
	// 		return genres.map(({ name }) => name);
	// 	} catch (err) {
	// 		throw new ProviderActionFailedError(this.name, 'getSongGenres', err.message);
	// 	}
	// }

	// async getAlbumType(albumIdentifer: MBID): Promise<AlbumType> {
	// 	try {
	// 		const album = await this.mbClient.lookupReleaseGroup(albumIdentifer);
	// 		const primaryType: string | undefined = album['primary-type'];
	// 		const secondaryTypes: string[] = (album as any)['secondary-types'] ?? [];

	// 		if (secondaryTypes.length == 0) {
	// 			switch (primaryType) {
	// 			case "Album":
	// 				return AlbumType.StudioRecording;
	// 			case "EP":
	// 			case "Single":
	// 				return AlbumType.Single;
	// 			case "Broadcast":
	// 				return AlbumType.LiveRecording;
	// 			default:
	// 				break;
	// 			}
	// 		}
	// 		// https://musicbrainz.org/release-group/ce018797-8764-34f8-aee4-10089fc7393d
	// 		if (!primaryType && secondaryTypes.includes("Remix")) {
	// 			return AlbumType.RemixAlbum;
	// 		}
	// 		if (primaryType == "Album") {
	// 			// https://musicbrainz.org/release-group/a1b16f9c-7b93-3351-9453-0f3545a5f989
	// 			if (secondaryTypes.includes("Remix")) {
	// 				return AlbumType.RemixAlbum;
	// 			}
	// 			// https://musicbrainz.org/release-group/ce018797-8764-34f8-aee4-10089fc7393d
	// 			if (secondaryTypes.includes("DJ-mix")) {
	// 				return AlbumType.RemixAlbum;
	// 			}
	// 			// https://musicbrainz.org/release-group/35f4c727-8b32-3457-a2e7-42a697dd39c2
	// 			if (secondaryTypes.includes("Compilation")) {
	// 				return AlbumType.Compilation;
	// 			}
	// 			if (secondaryTypes.includes("Live")) {
	// 				return AlbumType.LiveRecording;
	// 			}
	// 			if (secondaryTypes.includes("Soundtrack")) {
	// 				return AlbumType.Soundtrack;
	// 			}
	// 		}
	// 		if (primaryType == "Single") {
	// 			return AlbumType.Single;
	// 		}
	// 		if (primaryType == "EP") {
	// 			if (secondaryTypes.includes("Compilation")) {
	// 				return AlbumType.Compilation;
	// 			}
	// 			return AlbumType.Single;
	// 		}
	// 	} catch (err) {
	// 		throw new ProviderActionFailedError(this.name, 'getAlbumDescription', err.message);
	// 	}
	// 	throw new ProviderActionFailedError(this.name, 'getAlbumDescription', "Album Type unknown");
	// }

	// private async getWikipediaArticleName(wikidataId: string): Promise<string> {
	// 	const wikidataResponse = await this.httpService.axiosRef.get(
	// 		'/w/api.php',
	// 		{
	// 			baseURL: 'https://www.wikidata.org',
	// 			params: {
	// 				action: 'wbgetentities',
	// 				props: 'sitelinks',
	// 				ids: wikidataId,
	// 				sitefilter: 'enwiki',
	// 				format: 'json'
	// 			}
	// 		}
	// 	).then(({ data }) => data);

	// 	return (Object.entries(wikidataResponse.entities)
	// 		.at(0)![1] as any)
	// 		.sitelinks.enwiki.title;
	// }

	// private async getWikipediaDescription(resourceId: string): Promise<string> {
	// 	const wikipediaResponse = await this.httpService.axiosRef.get(
	// 		'/w/api.php',
	// 		{
	// 			baseURL: 'https://en.wikipedia.org',
	// 			params: {
	// 				format: 'json',
	// 				action: 'query',
	// 				prop: 'extracts',
	// 				exintro: true,
	// 				explaintext: true,
	// 				redirects: 1,
	// 				titles: decodeURIComponent(resourceId)
	// 			}
	// 		}
	// 	).then(({ data }) => data);

	// 	const stringifiedData = (Object
	// 		.entries(wikipediaResponse.query.pages)
	// 		.at(0)![1] as { extract: string })
	// 		.extract.trim();

	// 	if (stringifiedData.startsWith('Undefined may refer')) {
	// 		throw new ProviderActionFailedError(
	// 			this.name,
	// 			'getWikipediaDescription',
	// 			'No description found'
	// 		);
	// 	}
	// 	return stringifiedData;
	// }

	getArtistWikidataIdentifierProperty() {
		return "P434";
	}

	getAlbumWikidataIdentifierProperty() {
		return "P436";
	}

	getSongWikidataIdentifierProperty() {
		return "P435";
	}
}
