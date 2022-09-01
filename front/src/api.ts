import Album, { AlbumInclude, AlbumWithArtist } from "./models/album";
import Artist, { ArtistInclude } from "./models/artist";
import Library from "./models/library";
import { PaginatedResponse, PaginationParameters } from "./models/pagination";
import Song, { SongInclude, SongWithArtist } from "./models/song";
import Track, { TrackInclude, TrackWithRelease } from "./models/track";

type QueryParameters = {
	pagination?: PaginationParameters;
	include: string[];
}

const delay = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

export default class API {

	static defaultPageSize = 30;

	static async getAllLibraries(
		pagination?: PaginationParameters
	): Promise<PaginatedResponse<Library>> {
		return delay(2).then(() => ({
			items: [1, 2, 3].map((libraryIndex) => <Library>{
				title: `Library ${libraryIndex}`,
				id: libraryIndex,
				slug: `library-${libraryIndex}`,
			}),
			metadata: {
				this: '',
				next: null,
				previous: null,
				page: 0
			}
		}));
	}
	static async getAllArtists(
		pagination?: PaginationParameters, 
		include: ArtistInclude[] = []
	): Promise<PaginatedResponse<Artist>> {
		return fetch(this.buildURL('/artists', { pagination, include }))
			.then((response) => response.json());
	}

	static async getAllAlbums(
		pagination?: PaginationParameters,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<Album>> {
		return fetch(this.buildURL('/albums', { pagination, include }))
			.then((response) => response.json());
	}

	static async getAllArtistsInLibrary(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: ArtistInclude[] = [],
	): Promise<PaginatedResponse<Artist>> {
		return delay(2).then(() => ({
			items: Array.from({length: 100}, (_, i) => i + 1)
				.splice((pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize), pagination?.pageSize ?? this.defaultPageSize)
				.map((number) => <Artist>({
					id: number,
					slug: `artist-${number}`,
					illustration: `/artists/${number}/illustration`,
					name: `Artist ${number}`
				})),
			metadata: {
				this: '',
				next: (pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize)  >= 200 ? null : 'a',
				previous: null,
				page: pagination?.index ?? 1
			}
		}));
		// return fetch(this.buildURL(`/libraries/${librarySlugOrId}/albums`, { pagination, include }))
			// .then((response) => response.json());
	}

	static async getAllAlbumsInLibrary(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: AlbumInclude[] = [],
	): Promise<PaginatedResponse<AlbumWithArtist>> {
		return delay(2).then(() => ({
			items: Array.from({length: 100}, (_, i) => i + 1)
				.splice((pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize), pagination?.pageSize ?? this.defaultPageSize)
				.map((number) => <Album>({
					id: number,
					slug: `album-${number}`,
					illustration: `/albums/${number}/illustration`,
					name: `Album ${number}`,
					type: 'StudioRecording',
					artistId: number,
					artist: <Artist>{
						id: number,
						name: `Artist ${number}`,
						slug: `artist-${number}`,
						illustration: `/artist/${number}/illustration`,
					}
				})),
			metadata: {
				this: '',
				next: (pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize) >= 200 ? null : 'a',
				previous: null,
				page: pagination?.index ?? 1
			}
		}));
		// return fetch(this.buildURL(`/libraries/${librarySlugOrId}/albums`, { pagination, include }))
			// .then((response) => response.json());
	}

	static async getAllSongsInLibrary(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: SongInclude[] = [],
	): Promise<PaginatedResponse<SongWithArtist>> {
		return delay(2).then(() => ({
			items: Array.from({length: 100}, (_, i) => i + 1)
				.splice((pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize), pagination?.pageSize ?? this.defaultPageSize)
				.map((number) => <SongWithArtist>({
					id: number,
					slug: `song-${number}`,
					illustration: `/songs/${number}/illustration`,
					name: `Song ${number}`,
					playCount: 0,
					artistId: number,
					artist: <Artist>{
						id: number,
						name: `Artist ${number}`,
						slug: `artist-${number}`,
						illustration: `/artist/${number}/illustration`,
					}
				})),
			metadata: {
				this: '',
				next: (pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize) >= 200 ? null : 'a',
				previous: null,
				page: pagination?.index ?? 1
			}
		}));
		// return fetch(this.buildURL(`/libraries/${librarySlugOrId}/albums`, { pagination, include }))
			// .then((response) => response.json());
	}

	static async getAllSongs(
		pagination?: PaginationParameters,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<Song>> {
		return fetch(this.buildURL('/songs', { pagination, include }))
			.then((response) => response.json());
	}

	static async getMasterTrack(
		songId: number,
		include: TrackInclude[] = []
	): Promise<Track> {
		return delay(2).then(() => ({
			id: songId,
			songId: songId,
			releaseId: songId,
			displayName: `Master Track of ${songId}`,
			master: true,
			discIndex: 1,
			trackIndex: 1,
			type: 'Audio',
			bitrate: 320,
			duration: 60 + songId,
			illustration: `/tracks/${songId}/illustration`
		}));
		// return fetch(this.buildURL(`/songs/${songId}/master`, { include }))
			// .then((response) => response.json()); 
	}

	/**
	 * Get tracks of a song
	 * @param songId the id of the parent song
	 * @param include the relation to inclide
	 * @returns 
	 */
	static async getSongTracks(
		songId: number,
		pagination?: PaginationParameters,
		include: TrackInclude[] = []
	): Promise<PaginatedResponse<Track>> {
		return delay(2).then(() => ({
			items: Array.from({length: 20}, (_, i) => i + 1)
			.splice((pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize), pagination?.pageSize ?? this.defaultPageSize)
			.map((number) => <TrackWithRelease>({
					id: number,
					songId: songId,
					releaseId: number,
					displayName: `Track of ${songId}`,
					master: number == 0,
					discIndex: 1,
					trackIndex: number,
					type: 'Audio',
					bitrate: 320,
					duration: 60 + songId,
					illustration: `/tracks/${number}/illustration`,
					release: {
						id: number,
						title: `Release of track ${number}`,
						slug: `release-of-track-${number}`,
						master: true,
						albumId: 1
					}
				})),
			metadata: {
				this: '',
				next: (pagination?.index ?? 0) * (pagination?.pageSize ?? this.defaultPageSize) >= 20 ? null : 'a',
				previous: null,
				page: pagination?.index ?? 1
			}
		}))
	}



	/**
	 * Builds the URL to get an illustration from an object returned by the API
	 * @param imageURL 
	 * @returns the correct, rerouted URL
	 */
	static getIllustrationURL(imageURL: string): string {
		return `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/2300px-React-icon.svg.png`;
		return `/api${imageURL}`;
	}

	private static buildURL(route: string, parameters: QueryParameters): string {
		return `${route}${this.formatQueryParameters(parameters)}`;
	}

	private static formatQueryParameters(parameters: QueryParameters): string {
		if (parameters.include.length == 0 && parameters.pagination == null)
			return '';
		let formatted = '?';
		formatted.concat(this.formatInclude(parameters.include) ?? '');
		if (parameters.pagination)
			formatted.concat(this.formatPagination(parameters.pagination) ?? '');
		return formatted;
	}

	private static formatInclude(include: string[]): string | null {
		if (include.length == 0)
			return null;
		return `with=${include.join(',')}`;
	}

	private static formatPagination(pagination: PaginationParameters): string {
		let formattedParameters: string[] = [];
		const pageSize = pagination.pageSize ?? this.defaultPageSize;
		const pageIndex = pagination.index ?? 0;
		if (pageIndex !== 0)
			formattedParameters.concat(`skip=${pageSize * pageIndex}`);
		formattedParameters.concat(`take=${pageSize}`);
		return formattedParameters.join('&');
	}
}