import Album, { AlbumInclude, AlbumWithArtist } from "./models/album";
import Artist, { ArtistInclude } from "./models/artist";
import Genre from "./models/genre";
import Library from "./models/library";
import { PaginatedResponse, PaginationParameters } from "./models/pagination";
import Release, { ReleaseInclude } from "./models/release";
import Song, { SongInclude, SongWithArtist } from "./models/song";
import Track, { TrackInclude, TrackWithRelease } from "./models/track";
import Tracklist from "./models/tracklist";

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
	static async getAllAlbums<T extends Album = Album>(
		pagination?: PaginationParameters,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return fetch(this.buildURL(`/albums`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Fetch all album artists in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static async getAllArtistsInLibrary<T extends Artist = Artist>(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: ArtistInclude[] = [],
	): Promise<PaginatedResponse<T>> {
		return fetch(this.buildURL(`/libraries/${librarySlugOrId}/artists`, { pagination, include }, {'albumArtistOnly': true}))
			.then((response) => response.json());
	}

	/**
	 * Fetch all album in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static async getAllAlbumsInLibrary<T extends Album = Album>(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: AlbumInclude[] = [],
	): Promise<PaginatedResponse<T>> {
		return fetch(this.buildURL(`/libraries/${librarySlugOrId}/albums`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Fetch all songs in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getAllSongsInLibrary<T extends Song = Song>(
		librarySlugOrId: string | number,
		pagination?: PaginationParameters,
		include: SongInclude[] = [],
	): Promise<PaginatedResponse<T>> {
		return fetch(this.buildURL(`/libraries/${librarySlugOrId}/songs`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Fetch all songs
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getAllSongs<T extends Album = Album>(
		pagination?: PaginationParameters,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return fetch(this.buildURL(`/songs`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Get the master track of a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Track
	 */
	static async getMasterTrack<T extends Track = Track>(
		songSlugOrId: string | number,
		include: TrackInclude[] = []
	): Promise<T> {
		return fetch(this.buildURL(`/songs/${songSlugOrId}/master`, { include }))
			.then((response) => response.json()); 
	}

	/**
	 * Get tracks of a song
	 * @param songSlugOrId the id of the parent song
	 * @param include the relation to inclide
	 * @returns an array of tracks
	 */
	static async getSongTracks<T extends Track = Track>(
		songSlugOrId: string | number,
		pagination?: PaginationParameters,
		include: TrackInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return fetch(this.buildURL(`/songs/${songSlugOrId}/tracks`, { pagination, include }))
			.then((response) => response.json());
	}

	/**
	 * Get genres of a song
	 * @param songSlugOrId the id of the parent song
	 * @param pagination
	 * @returns an array of tracks
	 */
	static async getSongGenres(
		songSlugOrId: string | number,
		pagination?: PaginationParameters
	): Promise<PaginatedResponse<Genre>> {
		return fetch(this.buildURL(`/songs/${songSlugOrId}/genres`, { pagination, include: [] }))
			.then((response) => response.json());
	}

	/**
	 * Get genres of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of genres
	 */
	 static async getAlbumGenres(
		albumSlugOrId: string | number,
	): Promise<Genre[]> {
		return fetch(this.buildURL(`/albums/${albumSlugOrId}/genres`, { include: [] }))
			.then((response) => response.json());
	}

	static async getRelease<T extends Release = Release>(
		slugOrId: string | number,
		include: ReleaseInclude[] = []
	): Promise<T> {
		return fetch(this.buildURL(`/releases/${slugOrId}`, { include }))
			.then((response) => response.json());
	}

	static async getReleaseTrackList<T extends Track = Track> (
		slugOrId: string | number,
		include: TrackInclude[] = []
	): Promise<Tracklist<T>> {
		const response = await fetch(this.buildURL(`/releases/${slugOrId.toString()}/tracklist`, { include }));
		const body = await response.json();
		return new Map<string | '?', T[]>(Object.entries(body));
	}


	static async getArtist<T extends Artist = Artist>(
		slugOrId: string | number,
		include: ArtistInclude[] = []
	): Promise<T> {
		return fetch(this.buildURL(`/artists/${slugOrId}`, { include }))
			.then((response) => response.json());
	}



	/**
	 * Builds the URL to get an illustration from an object returned by the API
	 * @param imageURL 
	 * @returns the correct, rerouted URL
	 */
	static getIllustrationURL(imageURL: string): string {
		return `http://localhost:5000/api${imageURL}`;
	}

	private static buildURL(route: string, parameters: QueryParameters, otherParameters?: any): string {
		return `http://localhost:5000/api${route}${this.formatQueryParameters(parameters, otherParameters)}`;
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