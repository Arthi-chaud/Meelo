import Album, { AlbumInclude, AlbumWithArtist } from "./models/album";
import Artist, { ArtistInclude } from "./models/artist";
import Library from "./models/library";
import { PaginatedResponse, PaginationParameters } from "./models/pagination";
import Song, { SongInclude } from "./models/song";

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
		include: ArtistInclude[] = [],
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

	static async getAllSongs(
		pagination?: PaginationParameters,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<Song>> {
		return fetch(this.buildURL('/songs', { pagination, include }))
			.then((response) => response.json());
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