import Album, {
	AlbumInclude, AlbumSortingKeys, AlbumType, AlbumWithArtist
} from "../models/album";
import Artist, { ArtistInclude, ArtistSortingKeys } from "../models/artist";
import Genre from "../models/genre";
import Library from "../models/library";
import { PaginatedResponse, PaginationParameters } from "../models/pagination";
import Release, { ReleaseInclude, ReleaseSortingKeys } from "../models/release";
import Song, {
	SongInclude, SongSortingKeys, SongWithArtist
} from "../models/song";
import Track, {
	TrackInclude, TrackSortingKeys, TrackWithRelease
} from "../models/track";
import Tracklist from "../models/tracklist";
import { SortingParameters } from "../utils/sorting";
import LibraryTaskResponse from "../models/library-task-response";
import { ResourceNotFound } from "../exceptions";
import User, { UserSortingKeys } from "../models/user";
import store from "../state/store";

type AuthenticationResponse = {
	access_token: string;
}

type QueryParameters<Keys extends string[]> = {
	pagination?: PaginationParameters;
	include?: string[];
	sort?: SortingParameters<Keys>
}

type AuthenticationInput = {
	username: string;
	password: string;
}

type FetchParameters<Keys extends string[]> = {
	route: string,
	parameters: QueryParameters<Keys>,
	otherParameters?: any,
	errorMessage?: string,
	data?: Record<string, any>,
}

export default class API {
	/**
	 * Utilitary functions
	 */
	private static isSSR = () => typeof window === 'undefined';
	private static isDev = () => process.env.NODE_ENV === 'development';

	static defaultPageSize = 30;

	static async login(credentials: AuthenticationInput): Promise<AuthenticationResponse> {
		return API.fetch({
			route: '/auth/login',
			data: credentials,
			errorMessage: "Username or password is incorrect",
			parameters: {}
		}, 'POST');
	}

	static async register(credentials: AuthenticationInput): Promise<User> {
		return API.fetch({
			route: '/users/new',
			data: {
				name: credentials.username,
				password: credentials.password,
				admin: false
			},
			parameters: {}
		}, 'POST');
	}

	/**
	 * Fetch all libraries
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of libaries
	 */
	static async getAllLibraries(
		pagination?: PaginationParameters
	): Promise<PaginatedResponse<Library>> {
		return API.fetch({
			route: `/libraries`,
			errorMessage: "Libraries could not be loaded",
			parameters: { pagination: pagination, include: [] }
		});
	}

	/**
	 * Fetch all album artists
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static async getAllArtists(
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof ArtistSortingKeys>
	): Promise<PaginatedResponse<Artist>> {
		return API.fetch({
			route: `/artists`,
			errorMessage: 'Artists could not be loaded',
			parameters: { pagination, include: [], sort },
			otherParameters: { albumArtistOnly: 'true' }
		});
	}

	/**
	 * Fetch all albums
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static async getAllAlbums<T extends Album = Album>(
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		type?: AlbumType,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/albums`,
			errorMessage: 'Albums could not be loaded',
			parameters: { pagination, include, sort },
			otherParameters: { type }
		});
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
		sort?: SortingParameters<typeof ArtistSortingKeys>,
		include: ArtistInclude[] = [],
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/libraries/${librarySlugOrId}/artists`,
			errorMessage: 'Library does not exist',
			parameters: { pagination, include, sort },
			otherParameters: { albumArtistOnly: true }
		});
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
		type?: AlbumType,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include: AlbumInclude[] = [],
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/libraries/${librarySlugOrId}/albums`,
			errorMessage: 'Library does not exist',
			parameters: { pagination, include, sort },
			otherParameters: { type }
		});
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
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = [],
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/libraries/${librarySlugOrId}/songs`,
			errorMessage: 'Library does not exist',
			parameters: { pagination, include, sort }
		});
	}

	/**
	 * Fetch all songs
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getAllSongs<T extends Song = Song>(
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/songs`,
			errorMessage: 'Songs could not be loaded',
			parameters: { pagination, include, sort }
		});
	}

	/**
	 * Fetch all albums by an artist
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static async getArtistAlbums<T extends Album = Album>(
		artistSlugOrId: string | number,
		pagination?: PaginationParameters,
		type?: AlbumType,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/artists/${artistSlugOrId}/albums`,
			errorMessage: `Artist '${artistSlugOrId}' not found`,
			parameters: { pagination, include, sort },
			otherParameters: { type }
		});
	}

	/**
	 * Fetch all songs by an artist
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static async getArtistSongs<T extends Song = Song>(
		artistSlugOrId: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/artists/${artistSlugOrId}/songs`,
			errorMessage: `Artist '${artistSlugOrId}' not found`,
			parameters: { pagination, include, sort }
		});
	}

	/**
	 * Get a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Track
	 */
	static async getSong<T extends Song = Song>(
		songSlugOrId: string | number,
		include: SongInclude[] = []
	): Promise<T> {
		return API.fetch({
			route: `/songs/${songSlugOrId}`,
			parameters: { include }
		});
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
		return API.fetch({
			route: `/songs/${songSlugOrId}/master`,
			parameters: { include }
		});
	}

	/**
	 * Get the album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a release
	 */
	static async getAlbum<T extends Album = Album>(
		albumSlugOrId: string | number,
		include: AlbumInclude[] = []
	): Promise<T> {
		return API.fetch({
			route: `/albums/${albumSlugOrId}`,
			errorMessage: "Album not found",
			parameters: { include }
		});
	}

	static async getCurrentUserStatus(): Promise<User> {
		return API.fetch({
			route: `/users/me`,
			parameters: { }
		});
	}

	/**
	 * Fetch all users
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of users
	 */
	static async getUsers(
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof UserSortingKeys>,
	): Promise<PaginatedResponse<User>> {
		return API.fetch({
			route: `/users`,
			errorMessage: 'Users could not be loaded',
			parameters: { pagination, include: [], sort }
		});
	}

	/**
	 * Update a user's permissions in the database
	 * @param userId the id of the user to update
	 * @param updatedFields the fields to update
	 * @returns the updated user
	 */
	static async updateUser(
		userId: number,
		updatedFields: Partial<Pick<User, 'admin' | 'enabled'>>
	): Promise<User> {
		return API.fetch({
			route: `/users/${userId}`,
			errorMessage: 'User could not be updated',
			data: updatedFields,
			parameters: {}
		}, 'PUT');
	}

	/**
	 * Delete user
	 * @param userId the id of the user to delete
	 */
	static async deleteUser(
		userId: number,
	): Promise<User> {
		return API.fetch({
			route: `/users/${userId}`,
			errorMessage: 'User could not be deleted',
			parameters: {}
		}, 'DELETE');
	}

	/**
	 * Get the master release of an album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a release
	 */
	static async getMasterRelease<T extends Release = Release>(
		albumSlugOrId: string | number,
		include: ReleaseInclude[] = []
	): Promise<T> {
		return API.fetch({
			route: `/albums/${albumSlugOrId}/master`,
			parameters: { include }
		});
	}

	/**
	 * Get tracks of a song
	 * @param songSlugOrId the id of the parent song
	 * @param include the relation to include
	 * @returns an array of tracks
	 */
	static async getSongTracks<T extends Track = Track>(
		songSlugOrId: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof TrackSortingKeys>,
		include: TrackInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/songs/${songSlugOrId}/tracks`,
			parameters: { pagination, include, sort }
		});
	}

	/**
	 * Get versions of a song
	 * @param songSlugOrId the id of the  song
	 * @param include the relation to include
	 * @returns an array of tracks
	 */
	static async getSongVersions<T extends Song = Song>(
		songSlugOrId: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/songs/${songSlugOrId}/versions`,
			parameters: { pagination, include, sort }
		});
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
		return API.fetch({
			route: `/songs/${songSlugOrId}/genres`,
			parameters: { pagination, include: [] }
		});
	}

	/**
	 * Get genres of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of genres
	 */
	static async getAlbumGenres(
		albumSlugOrId: string | number,
	): Promise<Genre[]> {
		return API.fetch({
			route: `/albums/${albumSlugOrId}/genres`,
			parameters: { include: [] }
		});
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
		return API.fetch({
			route: `/albums/${albumSlugOrId}/videos`,
			parameters: { pagination, include: [] }
		});
	}

	/**
	 * Get releases of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of releases
	 */
	static async getAlbumReleases<T extends Release = Release>(
		albumSlugOrId: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof ReleaseSortingKeys>,
		include: ReleaseInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/albums/${albumSlugOrId}/releases`,
			parameters: { include, pagination, sort }
		});
	}

	static async getRelease<T extends Release = Release>(
		slugOrId: string | number,
		include: ReleaseInclude[] = []
	): Promise<T> {
		return API.fetch({
			route: `/releases/${slugOrId}`,
			errorMessage: 'Release not found',
			parameters: { include }
		});
	}

	static async getReleaseTrackList<T extends Track = Track>(
		slugOrId: string | number,
		include: TrackInclude[] = []
	): Promise<Tracklist<T>> {
		return this.fetch({
			route: `/releases/${slugOrId.toString()}/tracklist`,
			parameters: { include }
		});
	}

	static async getReleasePlaylist<T extends Track = Track>(
		slugOrId: string | number,
		include: TrackInclude[] = []
	): Promise<T[]> {
		return this.fetch({
			route: `/releases/${slugOrId.toString()}/playlist`,
			parameters: { include }
		});
	}

	static async getSongLyrics(
		slugOrId: string | number
	): Promise<string[] | null> {
		return API.fetch<{ lyrics: string }, []>({
			route: `/songs/${slugOrId}/lyrics`,
			errorMessage: 'Lyrics loading failed',
			parameters: { }
		}).then((value) => value.lyrics.split('\n')).catch(() => null);
	}

	static async getSongMainAlbum<T extends Album = Album>(
		songSlugOrId: string | number,
		include: AlbumInclude[] = []
	): Promise<T> {
		return API.getMasterTrack<TrackWithRelease>(songSlugOrId, ['release'])
			.then((track) => API.getAlbum(track.release.albumId, include));
	}

	static async getSongMainRelease<T extends Release = Release>(
		songSlugOrId: string | number,
		include: ReleaseInclude[] = []
	): Promise<T> {
		return API.getMasterTrack(songSlugOrId)
			.then((track) => API.getRelease(track.releaseId, include));
	}

	static async getArtist<T extends Artist = Artist>(
		slugOrId: string | number,
		include: ArtistInclude[] = []
	): Promise<T> {
		return API.fetch<T, []>({
			route: `/artists/${slugOrId}`,
			errorMessage: 'Artist could not be loaded',
			parameters: { include }
		});
	}

	/**
	 * Fetch all genres
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of genres
	 */
	static async getAllGenres(
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof ArtistSortingKeys>
	): Promise<PaginatedResponse<Genre>> {
		return API.fetch({
			route: `/genres`,
			errorMessage: 'Genres could not be loaded',
			parameters: { pagination, include: [], sort }
		});
	}

	/**
	 * Fetch one genre
	 */
	static async getGenre(idOrSlug: string | number): Promise<Genre> {
		return API.fetch({
			route: `/genres/${idOrSlug}`,
			errorMessage: 'Genre not found',
			parameters: {}
		});
	}

	/**
	 * Fetch all albums from a genre
	 */
	static async getGenreAlbums(
		idOrSlug: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		type?: AlbumType
	): Promise<PaginatedResponse<AlbumWithArtist>> {
		return API.fetch({
			route: `/genres/${idOrSlug}/albums`,
			errorMessage: 'Genre not found',
			parameters: { pagination, include: ['artist'], sort },
			otherParameters: { type }
		});
	}

	/**
	 * Fetch all artists from a genre
	 */
	static async getGenreArtists(
		idOrSlug: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof ArtistSortingKeys>,
	): Promise<PaginatedResponse<Artist>> {
		return API.fetch({
			route: `/genres/${idOrSlug}/artists`,
			errorMessage: 'Genre not found',
			parameters: { pagination, include: [], sort }
		});
	}

	/**
	 * Fetch all songs from a genre
	 */
	static async getGenreSongs(
		idOrSlug: string | number,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof SongSortingKeys>,
	): Promise<PaginatedResponse<SongWithArtist>> {
		return API.fetch({
			route: `/genres/${idOrSlug}/songs`,
			errorMessage: 'Genre not found',
			parameters: { pagination, include: ['artist'], sort }
		});
	}

	static async searchArtists<T extends Artist = Artist>(
		query: string,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof ArtistSortingKeys>,
		include: ArtistInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/search/artists/${query}`,
			errorMessage: 'Search failed',
			parameters: { pagination, include, sort }
		});
	}

	static async searchAlbums<T extends Album = Album>(
		query: string,
		pagination?: PaginationParameters,
		type?: AlbumType,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include: AlbumInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/search/albums/${query}`,
			errorMessage: 'Search failed',
			parameters: { pagination, include, sort },
			otherParameters: { type }
		});
	}

	static async searchSongs<T extends Song = Song>(
		query: string,
		pagination?: PaginationParameters,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = []
	): Promise<PaginatedResponse<T>> {
		return API.fetch({
			route: `/search/songs/${query}`,
			errorMessage: 'Search failed',
			parameters: { pagination, include, sort }
		});
	}

	private static async fetch<T, Keys extends string[]>({ route, parameters, otherParameters, errorMessage, data }: FetchParameters<Keys>, method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET'): Promise<T> {
		const accessToken = store.getState().user.accessToken;
		const header = {
			'Content-Type': 'application/json'
		};

		const response = await fetch(
			this.buildURL(route, parameters, otherParameters), {
				method,
				body: data ? JSON.stringify(data) : undefined,
				headers: accessToken ? {
					...header,
					Authorization: `Bearer ${accessToken}`
				} : header,
			}
		);
		const jsonResponse = await response.json().catch(() => {
			throw new Error("Error while parsing Server's response");
		});

		switch (response.status) {
		/// TODO SSR should be disabled if user is not authentified
		case 401:
			if (!this.isSSR()) {
				throw new Error(jsonResponse.message ?? errorMessage);
			}
			break;
		case 403:
			if (!this.isSSR()) {
				throw new Error(errorMessage ?? "Unauthorized: Only for admins");
			}
			break;
		case 404:
			throw new ResourceNotFound(errorMessage ?? jsonResponse.message ?? response.statusText);
		default:
			if (!response.ok) {
				throw new Error(errorMessage ?? jsonResponse.message ?? response.statusText);
			}
		}
		return jsonResponse;
	}

	static scanLibraries(): Promise<LibraryTaskResponse> {
		return API.fetch<LibraryTaskResponse, []>({
			route: `/tasks/scan`,
			parameters: { }
		});
	}

	/**
	 * Builds the URL to get an illustration from an object returned by the API
	 * @param imageURL
	 * @returns the correct, rerouted URL
	 */
	static getIllustrationURL(imageURL: string): string {
		if (API.isDev()) {
			return `${process.env.ssrApiRoute}${imageURL}`;
		}
		return `/api/${imageURL}`;
	}

	/**
	 * Builds the URL to get a track file from an object returned by the API
	 * @param streamURL
	 * @returns the correct, rerouted URL
	 */
	static getStreamURL(streamURL: string): string {
		return this.buildURL(streamURL, {});
	}

	/**
	 * Mark a song as played
	 * To be called when a song ends.
	 * @param songSlugOrId
	 * @returns
	 */
	static async setSongAsPlayed(songSlugOrId: string | number): Promise<void> {
		return API.fetch({
			route: `/songs/${songSlugOrId}/played`,
			errorMessage: 'Song update failed',
			parameters: {}
		}, 'PUT');
	}

	/**
	 * Mark a release as master
	 * @param releaseSlugOrId
	 * @returns
	 */
	static async setReleaseAsMaster(releaseSlugOrId: string | number): Promise<void> {
		return API.fetch({
			route: `/releases/${releaseSlugOrId}/master`,
			errorMessage: 'Release update failed',
			parameters: {}
		}, 'PUT');
	}

	/**
	 * Mark a track as master
	 * @param trackSlugOrId
	 * @returns
	 */
	static async setTrackAsMaster(trackSlugOrId: string | number): Promise<void> {
		return API.fetch({
			route: `/tracks/${trackSlugOrId}/master`,
			errorMessage: 'Track update failed',
			parameters: {}
		}, 'PUT');
	}

	private static buildURL(
		route: string, parameters: QueryParameters<any>, otherParameters?: any
	): string {
		const apiHost = API.isDev() || API.isSSR() ? process.env.ssrApiRoute : '/api';

		return `${apiHost}${route}${this.formatQueryParameters(parameters, otherParameters)}`;
	}

	private static formatQueryParameters<Keys extends string[]>(
		parameters: QueryParameters<Keys>, otherParameters?: any
	): string {
		const formattedQueryParams: string[] = [];

		if (parameters.sort) {
			formattedQueryParams.push(`sortBy=${parameters.sort.sortBy}`);
			formattedQueryParams.push(`order=${parameters.sort.order ?? 'asc'}`);
		}
		if ((parameters.include?.length ?? 0)!== 0) {
			formattedQueryParams.push(this.formatInclude(parameters.include!)!);
		}
		if (parameters.pagination) {
			formattedQueryParams.push(this.formatPagination(parameters.pagination));
		}
		for (const otherParams in otherParameters) {
			if (otherParameters[otherParams] !== undefined) {
				formattedQueryParams.push(`${encodeURIComponent(otherParams)}=${encodeURIComponent(otherParameters[otherParams])}`);
			}
		}
		if (formattedQueryParams.length === 0) {
			return '';
		}
		return `?${formattedQueryParams.join('&')}`;
	}

	private static formatInclude(include: string[]): string | null {
		if (include.length == 0) {
			return null;
		}
		return `with=${include.join(',')}`;
	}

	private static formatPagination(pagination: PaginationParameters): string {
		const formattedParameters: string[] = [];
		const pageSize = pagination.pageSize ?? this.defaultPageSize;
		const pageIndex = pagination.index ?? 0;

		if (pageIndex !== 0) {
			formattedParameters.push(`skip=${pageSize * pageIndex}`);
		}
		formattedParameters.push(`take=${pageSize}`);
		return formattedParameters.join('&');
	}
}
