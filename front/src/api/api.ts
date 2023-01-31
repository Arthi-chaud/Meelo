import Album, {
	AlbumInclude, AlbumSortingKeys, AlbumType, AlbumWithArtist
} from "../models/album";
import Artist, { ArtistInclude, ArtistSortingKeys } from "../models/artist";
import Genre from "../models/genre";
import Library from "../models/library";
import { PaginationParameters } from "../models/pagination";
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
import File from "../models/file";
import { InfiniteQuery, Query } from './use-query';

type AuthenticationResponse = {
	access_token: string;
}

type QueryParameters<Keys extends readonly string[]> = {
	pagination?: PaginationParameters;
	include?: string[];
	sort?: SortingParameters<Keys>
}

type AuthenticationInput = {
	username: string;
	password: string;
}

type FetchParameters<Keys extends readonly string[]> = {
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
	private static SSR_API_URL = process.env.ssrApiRoute!;
	static defaultPageSize = 25;

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
				password: credentials.password
			},
			parameters: {}
		}, 'POST');
	}

	/**
	 * Fetch all libraries
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of libaries
	 */
	static getAllLibraries(): InfiniteQuery<Library> {
		return {
			key: ['libraries'],
			exec: (lastPage) => API.fetch({
				route: `/libraries`,
				errorMessage: "Libraries could not be loaded",
				parameters: { pagination: lastPage, include: [] }
			})
		};
	}

	/**
	 * Clean all libraries
	 */
	static async cleanLibraries(): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/clean`,
			errorMessage: "Library clean failed",
			parameters: { }
		});
	}

	/**
	 * Scan a library
	 */
	static async scanLibrary(
		librarySlugOrId: number | string
	): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/scan/${librarySlugOrId}`,
			errorMessage: "Library scan failed",
			parameters: { }
		});
	}

	/**
	 * Clean a library
	 */
	static async cleanLibrary(
		librarySlugOrId: number | string
	): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/clean/${librarySlugOrId}`,
			errorMessage: "Library clean failed",
			parameters: { }
		});
	}

	/**
	 * Refresh metadata of files in library a library
	 */
	static async refreshMetadataInLibrary(
		librarySlugOrId: number | string
	): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/refresh-metadata/${librarySlugOrId}`,
			errorMessage: "Library refresh failed",
			parameters: { }
		});
	}

	/**
	 * Delete a library
	 */
	static async deleteLibrary(
		librarySlugOrId: number | string
	): Promise<void> {
		return API.fetch({
			route: `/libraries/${librarySlugOrId}`,
			errorMessage: "Library deletion failed",
			parameters: { }
		}, 'DELETE');
	}

	/**
	 * Fetch all album artists
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static getAllArtists(
		sort?: SortingParameters<typeof ArtistSortingKeys>
	): InfiniteQuery<Artist> {
		return {
			key: ['artists', sort ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/artists`,
				errorMessage: 'Artists could not be loaded',
				parameters: { pagination: lastPage, include: [], sort },
				otherParameters: { albumArtistOnly: 'true' }
			})
		};
	}

	/**
	 * Fetch all albums
	 * @returns An array of albums
	 */
	static getAllAlbums<T extends Album = Album>(
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		type?: AlbumType,
		include: AlbumInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['albums', sort ?? {}, type ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/albums`,
				errorMessage: 'Albums could not be loaded',
				parameters: { pagination: lastPage, include, sort },
				otherParameters: { type }
			})
		};
	}

	/**
	 * Fetch all album artists in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of artists
	 */
	static getAllArtistsInLibrary<T extends Artist = Artist>(
		librarySlugOrId: string | number,
		sort?: SortingParameters<typeof ArtistSortingKeys>,
		include: ArtistInclude[] = [],
	): InfiniteQuery<T> {
		return {
			key: ['libraries', librarySlugOrId, 'artists', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/libraries/${librarySlugOrId}/artists`,
				errorMessage: 'Library does not exist',
				parameters: { pagination: lastPage, include, sort },
				otherParameters: { albumArtistOnly: true }
			})
		};
	}

	/**
	 * Fetch all album in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static getAllAlbumsInLibrary<T extends Album = Album>(
		librarySlugOrId: string | number,
		type?: AlbumType,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include: AlbumInclude[] = [],
	): InfiniteQuery<T> {
		return {
			key: ['libraries', librarySlugOrId, 'albums', sort ?? {}, ...include, type ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/libraries/${librarySlugOrId}/albums`,
				errorMessage: 'Library does not exist',
				parameters: { pagination: lastPage, include, sort },
				otherParameters: { type }
			})
		};
	}

	/**
	 * Fetch all songs in a library
	 * @param librarySlugOrId the identifier of the library
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static getAllSongsInLibrary<T extends Song = Song>(
		librarySlugOrId: string | number,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = [],
	): InfiniteQuery<T> {
		return {
			key: ['libraries', librarySlugOrId, 'songs', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/libraries/${librarySlugOrId}/songs`,
				errorMessage: 'Library does not exist',
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	/**
	 * Fetch all songs
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static getAllSongs<T extends Song = Song>(
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['songs', ...include, sort ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/songs`,
				errorMessage: 'Songs could not be loaded',
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	/**
	 * Fetch all albums by an artist
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of albums
	 */
	static getArtistAlbums<T extends Album = Album>(
		artistSlugOrId: string | number,
		type?: AlbumType,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include: AlbumInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['artist', artistSlugOrId, 'albums', sort ?? {}, ...include, type ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/artists/${artistSlugOrId}/albums`,
				errorMessage: `Artist '${artistSlugOrId}' not found`,
				parameters: { pagination: lastPage, include, sort },
				otherParameters: { type }
			})
		};
	}

	/**
	 * Fetch all songs by an artist
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of songs
	 */
	static getArtistSongs<T extends Song = Song>(
		artistSlugOrId: string | number,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: AlbumInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['artist', artistSlugOrId, 'songs', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/artists/${artistSlugOrId}/songs`,
				errorMessage: `Artist '${artistSlugOrId}' not found`,
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	/**
	 * Get a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Track
	 */
	static getSong<T extends Song = Song>(
		songSlugOrId: string | number,
		include: SongInclude[] = []
	): Query<T> {
		return {
			key: ['song', songSlugOrId, ...include],
			exec: () => API.fetch({
				route: `/songs/${songSlugOrId}`,
				parameters: { include }
			})
		};
	}

	/**
	 * Get the master track of a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Track
	 */
	static getMasterTrack<T extends Track = Track>(
		songSlugOrId: string | number,
		include: TrackInclude[] = []
	): Query<T> {
		return {
			key: ['song', songSlugOrId, 'master', ...include],
			exec: () => API.fetch({
				route: `/songs/${songSlugOrId}/master`,
				parameters: { include }
			})
		};
	}

	/**
	 * Get the track of a song
	 * @param trackId the identifier of a track
	 * @param include the fields to include in the fetched item
	 * @returns a Track
	 */
	static getTrack<T extends Track = Track>(
		trackId: string | number,
		include: TrackInclude[] = []
	): Query<T> {
		return {
			key: ['track', trackId, ...include],
			exec: () => API.fetch({
				route: `/tracks/${trackId}`,
				parameters: { include }
			})
		};
	}

	/**
	 * Get source file of a track
	 * @param sourceFileId the identifier of a file
	 * @param include the fields to include in the fetched item
	 * @returns a File
	 */
	static getSourceFile<T extends File = File>(
		sourceFileId: string | number
	): Query<T> {
		return {
			key: ['file', sourceFileId],
			exec: () => API.fetch({
				route: `/files/${sourceFileId}`,
				parameters: { include: [] }
			})
		};
	}

	/**
	 * Get the album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a release
	 */
	static getAlbum<T extends Album = Album>(
		albumSlugOrId: string | number,
		include: AlbumInclude[] = []
	): Query<T> {
		return {
			key: ['album', albumSlugOrId, ...include],
			exec: () => API.fetch({
				route: `/albums/${albumSlugOrId}`,
				errorMessage: "Album not found",
				parameters: { include }
			})
		};
	}

	static getCurrentUserStatus(): Query<User> {
		return {
			key: ['user'],
			exec: () => API.fetch({
				route: `/users/me`,
				parameters: { }
			})
		};
	}

	/**
	 * Fetch all users
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of users
	 */
	static getUsers(
		sort?: SortingParameters<typeof UserSortingKeys>,
	): InfiniteQuery<User> {
		return {
			key: ['users', sort ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/users`,
				errorMessage: 'Users could not be loaded',
				parameters: { pagination: lastPage, include: [], sort }
			})
		};
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
	static getMasterRelease<T extends Release = Release>(
		albumSlugOrId: string | number,
		include: ReleaseInclude[] = []
	): Query<T> {
		return {
			key: ['album', albumSlugOrId, 'master', ...include],
			exec: () => API.fetch({
				route: `/albums/${albumSlugOrId}/master`,
				parameters: { include }
			})
		};
	}

	/**
	 * Get tracks of a song
	 * @param songSlugOrId the id of the parent song
	 * @param include the relation to include
	 * @returns an array of tracks
	 */
	static getSongTracks<T extends Track = Track>(
		songSlugOrId: string | number,
		sort?: SortingParameters<typeof TrackSortingKeys>,
		include: TrackInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['song', songSlugOrId, 'tracks', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/songs/${songSlugOrId}/tracks`,
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	/**
	 * Get video tracks of a song
	 * @param songSlugOrId the id of the parent song
	 * @param include the relation to include
	 * @returns an array of video tracks
	 */
	static getSongVideos<T extends Track = Track>(
		songSlugOrId: string | number,
		sort?: SortingParameters<typeof TrackSortingKeys>,
		include: TrackInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['song', songSlugOrId, 'videos', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/songs/${songSlugOrId}/videos`,
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	/**
	 * Get versions of a song
	 * @param songSlugOrId the id of the  song
	 * @param include the relation to include
	 * @returns an array of tracks
	 */
	static getSongVersions<T extends Song = Song>(
		songSlugOrId: string | number,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['song', songSlugOrId, 'versions', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/songs/${songSlugOrId}/versions`,
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	/**
	 * Get genres of a song
	 * @param songSlugOrId the id of the parent song
	 * @param pagination
	 * @returns an array of genres
	 */
	static getSongGenres(
		songSlugOrId: string | number
	): InfiniteQuery<Genre> {
		return {
			key: ['song', songSlugOrId, 'genres'],
			exec: (lastPage) => API.fetch({
				route: `/songs/${songSlugOrId}/genres`,
				parameters: { pagination: lastPage, include: [] }
			})
		};
	}

	/**
	 * Get genres of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of genres
	 */
	static getAlbumGenres(
		albumSlugOrId: string | number,
	): InfiniteQuery<Genre> {
		return {
			key: ['album', albumSlugOrId, 'genres'],
			exec: (lastPage) => API.fetch({
				route: `/albums/${albumSlugOrId}/genres`,
				parameters: { include: [] }
			})
		};
	}

	/**
	 * Get videos of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of videos
	 */
	static getAlbumVideos<T extends Track = Track>(
		albumSlugOrId: string | number,
		include: TrackInclude[] = []
	): Query<T[]> {
		return {
			key: ['album', albumSlugOrId, 'videos', ...include],
			exec: () => API.fetch({
				route: `/albums/${albumSlugOrId}/videos`,
				parameters: { include }
			})
		};
	}

	/**
	 * Get releases of a album
	 * @param albumSlugOrId the id of the album
	 * @returns an array of releases
	 */
	static getAlbumReleases<T extends Release = Release>(
		albumSlugOrId: string | number,
		sort?: SortingParameters<typeof ReleaseSortingKeys>,
		include: ReleaseInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['album', albumSlugOrId, 'releases', sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/albums/${albumSlugOrId}/releases`,
				parameters: { include, pagination: lastPage, sort }
			})
		};
	}

	static getRelease<T extends Release = Release>(
		slugOrId: string | number,
		include: ReleaseInclude[] = []
	): Query<T> {
		return {
			key: ['release', slugOrId, ...include],
			exec: () => API.fetch({
				route: `/releases/${slugOrId}`,
				errorMessage: 'Release not found',
				parameters: { include }
			})
		};
	}

	static getReleaseTrackList<T extends Track = Track>(
		slugOrId: string | number,
		include: TrackInclude[] = []
	): Query<Tracklist<T>> {
		return {
			key: ['release', slugOrId, 'tracklist', ...include],
			exec: () => API.fetch({
				route: `/releases/${slugOrId.toString()}/tracklist`,
				parameters: { include }
			})
		};
	}

	static getReleasePlaylist<T extends Track = Track>(
		slugOrId: string | number,
		include: TrackInclude[] = []
	): Query<T[]> {
		return {
			key: ['release', slugOrId, 'playlist', ...include],
			exec: () => API.fetch({
				route: `/releases/${slugOrId.toString()}/playlist`,
				parameters: { include }
			})
		};
	}

	static getSongLyrics(
		slugOrId: string | number
	): Query<string[] | null> {
		return {
			key: ['song', slugOrId, 'lyrics'],
			exec: () => API.fetch<{ lyrics: string }, []>({
				route: `/songs/${slugOrId}/lyrics`,
				errorMessage: 'Lyrics loading failed',
				parameters: { }
			})
				.then((value) => value.lyrics.split('\n'))
				.catch(() => null)
		};
	}

	static getSongMainAlbum<T extends Album = Album>(
		songSlugOrId: string | number,
		include: AlbumInclude[] = []
	): Query<T> {
		return {
			key: ['song', songSlugOrId, 'album', ...include],
			exec: () => API.getMasterTrack<TrackWithRelease>(songSlugOrId, ['release'])
				.exec()
				.then((track) => API.getAlbum<T>(track.release.albumId, include).exec())
		};
	}

	static getSongMainRelease<T extends Release = Release>(
		songSlugOrId: string | number,
		include: ReleaseInclude[] = []
	): Query<T> {
		return {
			key: ['song', songSlugOrId, 'release', ...include],
			exec: () => API.getMasterTrack(songSlugOrId)
				.exec()
				.then((track) => API.getRelease<T>(track.releaseId, include).exec())
		};
	}

	static getArtist<T extends Artist = Artist>(
		slugOrId: string | number,
		include: ArtistInclude[] = []
	): Query<T> {
		return {
			key: ['artist', slugOrId, ...include],
			exec: () => API.fetch<T, []>({
				route: `/artists/${slugOrId}`,
				errorMessage: 'Artist could not be loaded',
				parameters: { include }
			})
		};
	}

	/**
	 * Fetch all genres
	 * @param pagination the parameters to choose how many items to load
	 * @returns An array of genres
	 */
	static getAllGenres(
		sort?: SortingParameters<typeof ArtistSortingKeys>
	): InfiniteQuery<Genre> {
		return {
			key: ['genres', sort ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/genres`,
				errorMessage: 'Genres could not be loaded',
				parameters: { pagination: lastPage, include: [], sort }
			})
		};
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
	static getGenreAlbums(
		idOrSlug: string | number,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		type?: AlbumType
	): InfiniteQuery<AlbumWithArtist> {
		return {
			key: ['genre', idOrSlug, 'albums', sort ?? {}, type ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/genres/${idOrSlug}/albums`,
				errorMessage: 'Genre not found',
				parameters: { pagination: lastPage, include: ['artist'], sort },
				otherParameters: { type }
			})
		};
	}

	/**
	 * Fetch all artists from a genre
	 */
	static getGenreArtists(
		idOrSlug: string | number,
		sort?: SortingParameters<typeof ArtistSortingKeys>,
	): InfiniteQuery<Artist> {
		return {
			key: ['genre', idOrSlug, 'artists', sort ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/genres/${idOrSlug}/artists`,
				errorMessage: 'Genre not found',
				parameters: { pagination: lastPage, include: [], sort }
			})
		};
	}

	/**
	 * Fetch all songs from a genre
	 */
	static getGenreSongs(
		idOrSlug: string | number,
		sort?: SortingParameters<typeof SongSortingKeys>,
	): InfiniteQuery<SongWithArtist> {
		return {
			key: ['genre', idOrSlug, 'songs', sort ?? {}],
			exec: (lastPage) => API.fetch({
				route: `/genres/${idOrSlug}/songs`,
				errorMessage: 'Genre not found',
				parameters: { pagination: lastPage, include: ['artist'], sort }
			})
		};
	}

	static searchArtists<T extends Artist = Artist>(
		query: string,
		sort?: SortingParameters<typeof ArtistSortingKeys>,
		include: ArtistInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['search', 'artists', query, sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/search/artists/${query}`,
				errorMessage: 'Search failed',
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	static searchAlbums<T extends Album = Album>(
		query: string,
		type?: AlbumType,
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include: AlbumInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['search', 'albums', query, sort ?? {}, type ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/search/albums/${query}`,
				errorMessage: 'Search failed',
				parameters: { pagination: lastPage, include, sort },
				otherParameters: { type }
			})
		};
	}

	static searchSongs<T extends Song = Song>(
		query: string,
		sort?: SortingParameters<typeof SongSortingKeys>,
		include: SongInclude[] = []
	): InfiniteQuery<T> {
		return {
			key: ['search', 'songs', query, sort ?? {}, ...include],
			exec: (lastPage) => API.fetch({
				route: `/search/songs/${query}`,
				errorMessage: 'Search failed',
				parameters: { pagination: lastPage, include, sort }
			})
		};
	}

	private static async fetch<T, Keys extends readonly string[]>(
		{ route, parameters, otherParameters, errorMessage, data }: FetchParameters<Keys>,
		method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET'
	): Promise<T> {
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
			return `${this.SSR_API_URL}${imageURL}`;
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
	 * Builds the URL to get an archive of a given release
	 * @param releaseId slug or id of the release
	 * @returns the correct, rerouted URL
	 */
	static getReleaseArchiveURL(releaseId: number | string): string {
		return this.buildURL(`/releases/${releaseId}/archive`, {});
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
		const apiHost = API.isDev() || API.isSSR() ? this.SSR_API_URL : '/api';

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
