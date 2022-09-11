import Album, { AlbumInclude, AlbumWithArtist } from "./models/album";
import Artist, { ArtistInclude } from "./models/artist";
import Genre from "./models/genre";
import Library from "./models/library";
import { PaginatedResponse, PaginationParameters } from "./models/pagination";
import Release, { ReleaseInclude } from "./models/release";
import Song, { SongInclude, SongWithArtist } from "./models/song";
import Track, { TrackInclude, TrackWithRelease } from "./models/track";
import Tracklist from "./models/tracklist";
import axios from 'axios';
type QueryParameters = {
	pagination?: PaginationParameters;
	include?: string[];
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
		return API.fetch(`/libraries`, { pagination: pagination, include: [] });
	}
	/**
	 * Fetch all album artists
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static async getAllArtists(
		pagination?: PaginationParameters, 
	): Promise<PaginatedResponse<Artist>> {
		return API.fetch(`/artists`, { pagination, include: [] }, {'albumArtistOnly': true});
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
		return API.fetch(`/albums`, { pagination, include });
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
		return API.fetch(`/libraries/${librarySlugOrId}/artists`, { pagination, include }, {'albumArtistOnly': true});
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
		return API.fetch(`/libraries/${librarySlugOrId}/albums`, { pagination, include });
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
		return API.fetch(`/libraries/${librarySlugOrId}/songs`, { pagination, include });
	}

	/**
	 * Fetch all songs
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getAllSongs<T extends Song = Song>(
		pagination?: PaginationParameters,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch(`/songs`, { pagination, include });
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
		return API.fetch(`/songs/${songSlugOrId}/master`, { include }); 
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
		return API.fetch(`/songs/${songSlugOrId}/tracks`, { pagination, include });
	}

	/**
	 * Get genres of a song
	 * @param songSlugOrId the id of the parent song
	 * @param pagination
	 * @returns an array of genres
	 */
	static async getSongGenres(
		songSlugOrId: string | number,
		pagination?: PaginationParameters
	): Promise<PaginatedResponse<Genre>> {
		return API.fetch(`/songs/${songSlugOrId}/genres`, { pagination, include: [] });
	}

	/**
	 * Get genres of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of genres
	 */
	 static async getAlbumGenres(
		albumSlugOrId: string | number,
	): Promise<Genre[]> {
		return API.fetch(`/albums/${albumSlugOrId}/genres`, { include: [] });
	}
	/**
	 * Get videos of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of videos
	 */
	 static async getAlbumVideos(
		albumSlugOrId: string | number,
		pagination?: PaginationParameters,
	): Promise<PaginatedResponse<Track>> {
		return API.fetch(`/albums/${albumSlugOrId}/videos`, { pagination, include: [] });
	}
	/**
	 * Get releases of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of releases
	 */
	 static async getAlbumReleases<T extends Release = Release>(
		albumSlugOrId: string | number,
		pagination?: PaginationParameters,
		include: ReleaseInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch(`/albums/${albumSlugOrId}/releases`, { include, pagination });
	}

	static async getRelease<T extends Release = Release>(
		slugOrId: string | number,
		include: ReleaseInclude[] = []
	): Promise<T> {
		return API.fetch(`/releases/${slugOrId}`, { include }).catch("Release not found");
	}

	static async getReleaseTrackList<T extends Track = Track> (
		slugOrId: string | number,
		include: TrackInclude[] = []
	): Promise<Tracklist<T>> {
		const response = await this.fetch(`/releases/${slugOrId.toString()}/tracklist`, { include });
		return new Map<string | '?', T[]>(Object.entries(response));
	}


	static async getArtist<T extends Artist = Artist>(
		slugOrId: string | number,
		include: ArtistInclude[] = []
	): Promise<T> {
		return API.fetch(`/artists/${slugOrId}`, { include });
	}

	private static async fetch(route: string, parameters: QueryParameters, otherParameters?: any) {
		return axios.get(this.buildURL(route, parameters, otherParameters))
			.then(
				(response) => response.data,
				(error) => { throw new Error(error?.response?.data.error ?? error?.response?.statusText ) }
			);
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
		
		if ((parameters.include?.length ?? 0)!== 0)
			formattedQueryParams.push(this.formatInclude(parameters.include!)!);
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