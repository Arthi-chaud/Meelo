import Album, { AlbumInclude, AlbumWithArtist } from "./models/album";
import Artist, { ArtistInclude } from "./models/artist";
import Library from "./models/library";
import { PaginatedResponse, PaginationParameters } from "./models/pagination";
import Release, { ReleaseInclude } from "./models/release";
import Song, { SongInclude, SongWithArtist } from "./models/song";
import Track, { TrackInclude, TrackWithRelease } from "./models/track";

type QueryParameters = {
	pagination?: PaginationParameters;
	include: string[];
}

export default class API {

	static defaultPageSize = 30;

	/**
	 * Fetch all libraries
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of libaries
	 */
	static async getAllLibraries(
		pagination?: PaginationParameters
	): Promise<PaginatedResponse<Library>> {
		return fetch(this.buildURL(`/libraries`, { pagination: pagination, include: [] }))
			.then((response) => response.json());
	}
	/**
	 * Fetch all album artists
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static async getAllArtists(
		pagination?: PaginationParameters, 
	): Promise<PaginatedResponse<Artist>> {
		return fetch(this.buildURL(`/artists`, { pagination, include: [] }, {'albumArtistOnly': true}))
			.then((response) => response.json());
	}

	/**
	 * Fetch all albums
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static async getAllAlbums(
		pagination?: PaginationParameters,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<Album>> {
		return fetch(this.buildURL(`/albums`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Fetch all album artists in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static async getAllArtistsInLibrary(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: ArtistInclude[] = [],
	): Promise<PaginatedResponse<Artist>> {
		return fetch(this.buildURL(`/libraries/${librarySlugOrId}/artists`, { pagination, include }, {'albumArtistOnly': true}))
			.then((response) => response.json());
	}

	/**
	 * Fetch all album in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static async getAllAlbumsInLibrary(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: AlbumInclude[] = [],
	): Promise<PaginatedResponse<AlbumWithArtist>> {
		return fetch(this.buildURL(`/libraries/${librarySlugOrId}/albums`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Fetch all songs in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getAllSongsInLibrary(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: SongInclude[] = [],
	): Promise<PaginatedResponse<SongWithArtist>> {
		return fetch(this.buildURL(`/libraries/${librarySlugOrId}/songs`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Fetch all songs
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getAllSongs(
		pagination?: PaginationParameters,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<Song>> {
		return fetch(this.buildURL(`/songs`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Get the master track of a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Track
	 */
	static async getMasterTrack(
		songSlugOrId: string | number,
		include: TrackInclude[] = []
	): Promise<Track> {
		return fetch(this.buildURL(`/songs/${songSlugOrId}/master`, { include }))
			.then((response) => response.json()); 
	}

	/**
	 * Get tracks of a song
	 * @param songId the id of the parent song
	 * @param include the relation to inclide
	 * @returns an array of tracks
	 */
	static async getSongTracks(
		songSlugOrId: string | number,
		pagination?: PaginationParameters,
		include: TrackInclude[] = []
	): Promise<PaginatedResponse<Track>> {
		return fetch(this.buildURL(`/songs/${songSlugOrId}/tracks`, { pagination, include }))
			.then((response) => response.json());
	}

	static async getRelease(
		slugOrId: string | number,
		include: ReleaseInclude[] = []
	): Promise<Release> {
		return fetch(this.buildURL(`/releases/${slugOrId}`, { include }))
			.then((response) => response.json());
	}



	/**
	 * Builds the URL to get an illustration from an object returned by the API
	 * @param imageURL 
	 * @returns the correct, rerouted URL
	 */
	static getIllustrationURL(imageURL: string): string {
		return `/api${imageURL}`;
	}

	private static buildURL(route: string, parameters: QueryParameters, otherParameters?: any): string {
		return `/api${route}${this.formatQueryParameters(parameters, otherParameters)}`;
	}

	private static formatQueryParameters(parameters: QueryParameters, otherParameters?: any): string {
		let formattedQueryParams: string[] = [];
		
		if (parameters.include.length !== 0)
			formattedQueryParams.push(this.formatInclude(parameters.include)!);
		if (parameters.pagination)
			formattedQueryParams.push(this.formatPagination(parameters.pagination));
		for (let otherParams in otherParameters)
			formattedQueryParams.push(`${encodeURIComponent(otherParams)}=${encodeURIComponent(otherParameters[otherParams])}`);
		if (formattedQueryParams.length === 0)
			return '';
		return `?${formattedQueryParams.join('&')}`;
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
			formattedParameters.push(`skip=${pageSize * pageIndex}`);
		formattedParameters.push(`take=${pageSize}`);
		return formattedParameters.join('&');
	}
}