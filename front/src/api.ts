import Album, { AlbumInclude } from "./models/album";
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
				previous: null
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
				.splice(pagination?.skip ?? 0, pagination?.take ?? 20)
				.map((number) => <Artist>({
					id: number,
					slug: `artist-${number}`,
					illustration: `/artists/artist-${number}/illustration`,
					name: `Artist ${number}`
				})),
			metadata: {
				this: '',
				next: (pagination?.skip ?? 0) >= 200 ? null : 'a',
				previous: null,
				page: pagination?.skip ?? 0 / (pagination?.take ?? 20)
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

	private static formatPagination(pagination: PaginationParameters): string | null {
		let formattedParameters: string[] = []; 
		if (pagination.skip !== undefined)
			formattedParameters.concat(`skip=${pagination.skip}`);
		if (pagination.take !== undefined)
			formattedParameters.concat(`take=${pagination.take}`);
		if (formattedParameters.length == 0)
			return null;
		return formattedParameters.join('&');
	}
}