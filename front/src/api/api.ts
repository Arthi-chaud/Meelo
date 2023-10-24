import {
	AlbumInclude, AlbumSortingKeys, AlbumType, AlbumWithRelations
} from "../models/album";
import Artist, {
	ArtistInclude, ArtistSortingKeys, ArtistWithRelations
} from "../models/artist";
import Genre from "../models/genre";
import Library from "../models/library";
import PaginatedResponse, { PaginationParameters } from "../models/pagination";
import {
	ReleaseInclude, ReleaseSortingKeys, ReleaseWithRelations
} from "../models/release";
import {
	SongInclude, SongSortingKeys, SongType, SongWithRelations
} from "../models/song";
import { VideoWithRelations } from "../models/video";
import {
	TrackInclude, TrackSortingKeys, TrackWithRelations
} from "../models/track";
import Tracklist from "../models/tracklist";
import { SortingParameters } from "../utils/sorting";
import LibraryTaskResponse from "../models/library-task-response";
import { ResourceNotFound } from "../exceptions";
import User, { UserSortingKeys } from "../models/user";
import store from "../state/store";
import File from "../models/file";
import { InfiniteQuery, Query } from './use-query';
import * as yup from 'yup';
import { RequireExactlyOne } from "type-fest";
import Playlist, {
	PlaylistInclude, PlaylistSortingKeys, PlaylistWithRelations
} from "../models/playlist";
import { isSSR } from '../ssr';

const AuthenticationResponse = yup.object({
	access_token: yup.string().required()
});

type Identifier = number | string;

type NullableIdentifier = Identifier | null;

type AuthenticationResponse = yup.InferType<typeof AuthenticationResponse>;

type QueryParameters<Keys extends readonly string[]> = {
	pagination?: PaginationParameters;
	include?: string[];
	sort?: SortingParameters<Keys>
}

type AuthenticationInput = {
	username: string;
	password: string;
}

type FetchParameters<Keys extends readonly string[], ReturnType> = {
	route: string,
	parameters: QueryParameters<Keys>,
	otherParameters?: any,
	errorMessage?: string,
	data?: Record<string, any>,
	method?: 'GET' | 'PUT' | 'POST' | 'DELETE',
} & RequireExactlyOne<{
	emptyResponse: true,
	validator: yup.Schema<ReturnType>,
	customValidator: (value: unknown) => Promise<ReturnType>
}>

export default class API {
	/**
	 * Formats an array of include keys for Query keys
	 */
	private static formatIncludeKeys = (includes?: string[]) => includes?.map((include) => `include-${include}`) ?? [];
	private static formatObject = (includes?: object) => includes
		? Object.entries(includes)
			.filter(([key, value]) => value !== null && value !== undefined && value !== 'view')
			.map(([key, value]) => `params-${key}-${value}`)
		: [];

	/**
	 * Utilitary functions
	 */
	private static isDev = () => process.env.NODE_ENV === 'development';

	private static SSR_API_URL = process.env.ssrApiRoute!;
	static defaultPageSize = 35;

	/**
	 * @param credentials the credentials of the user to authenticate
	 * @returns An object holding the access token to use for authenticated requests
	 */
	static async login(credentials: AuthenticationInput): Promise<AuthenticationResponse> {
		return API.fetch({
			route: '/auth/login',
			data: credentials,
			errorMessage: "Username or password is incorrect",
			parameters: {},
			method: 'POST',
			validator: AuthenticationResponse
		});
	}

	/**
	 * Creates a new user
	 * @param credentials the credentails of the new user
	 * @returns The newly created user
	 */
	static async register(credentials: AuthenticationInput): Promise<User> {
		return API.fetch({
			route: '/users/new',
			data: {
				name: credentials.username,
				password: credentials.password
			},
			parameters: {},
			method: 'POST',
			validator: User
		});
	}

	/**
	 * Fetch all libraries
	 * @returns An InfiniteQuery of Libraries
	 */
	static getLibraries(): InfiniteQuery<Library> {
		return {
			key: ['libraries'],
			exec: (pagination) => API.fetch({
				route: `/libraries`,
				errorMessage: "Libraries could not be loaded",
				parameters: { pagination: pagination, include: [] },
				validator: PaginatedResponse(Library)
			}),
		};
	}

	/**
	 * Fetch all playlists
	 * @returns An InfiniteQuery of playlists
	 */
	static getPlaylists(
		filter: { album?: Identifier },
		sort?: SortingParameters<typeof PlaylistSortingKeys>
	): InfiniteQuery<Playlist> {
		return {
			key: ['playlists', ...API.formatObject(sort), ...API.formatObject(filter)],
			exec: (pagination) => API.fetch({
				route: `/playlists`,
				errorMessage: "Playlists could not be loaded",
				parameters: { pagination: pagination, include: [], sort },
				otherParameters: filter,
				validator: PaginatedResponse(Playlist)
			}),
		};
	}

	static async createPlaylist(playlistName: string): Promise<Playlist> {
		return API.fetch({
			route: '/playlists/new',
			data: { name: playlistName },
			errorMessage: "Playlist Creation Failed",
			parameters: {},
			method: 'POST',
			validator: Playlist
		});
	}

	static async updatePlaylist(
		playlistName: string,
		playlistSlugOrId: number | string
	): Promise<Playlist> {
		return API.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			data: { name: playlistName },
			parameters: {},
			method: 'PUT',
			validator: Playlist
		});
	}

	static async reorderPlaylist(
		playlistSlugOrId: number | string,
		entriesIds: number[]
	): Promise<void> {
		return API.fetch({
			route: `/playlists/${playlistSlugOrId}/reorder`,
			data: { entryIds: entriesIds },
			parameters: {},
			method: 'PUT',
			emptyResponse: true
		});
	}

	/**
	 * Fetch one playlist
	 * @returns An query for a playlist
	 */
	static getPlaylist<I extends PlaylistInclude>(
		playlistSlugOrId: string | number,
		include?: I[]
	): Query<PlaylistWithRelations<I>> {
		return {
			key: ['playlist', playlistSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/playlists/${playlistSlugOrId}`,
				parameters: { include },
				validator: PlaylistWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Calls for a task to clean all libraries
	 * @returns A object with the status of the task
	 */
	static async cleanLibraries(): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/clean`,
			errorMessage: "Library clean failed",
			parameters: { },
			validator: LibraryTaskResponse
		});
	}

	/**
	 * Calls for a task to fetch external metadata
	 * @returns A object with the status of the task
	 */
	static async fetchExternalMetadata(): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/fetch-external-metadata`,
			errorMessage: "Fetch failed",
			parameters: { },
			validator: LibraryTaskResponse
		});
	}

	/**
	 * Calls for a task to scan a library
	 * @returns A object with the status of the task
	 */
	static async scanLibrary(
		librarySlugOrId: number | string
	): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/scan/${librarySlugOrId}`,
			errorMessage: "Library scan failed",
			parameters: { },
			validator: LibraryTaskResponse
		});
	}

	/**
	 * Calls for a task to clean a library
	 * @returns A object with the status of the task
	 */
	static async cleanLibrary(
		librarySlugOrId: number | string
	): Promise<LibraryTaskResponse> {
		return API.fetch({
			route: `/tasks/clean/${librarySlugOrId}`,
			errorMessage: "Library clean failed",
			parameters: { },
			validator: LibraryTaskResponse
		});
	}

	/**
	 * Calls for a task to scan all libraries
	 * @returns the status of the task
	 */
	static scanLibraries(): Promise<LibraryTaskResponse> {
		return API.fetch<LibraryTaskResponse, []>({
			route: `/tasks/scan`,
			parameters: { },
			validator: LibraryTaskResponse
		});
	}

	/**
	 * Calls for a task to refresh metadata of files in a library
	 * @returns A object with the status of the task
	 */
	static async refreshMetadata(
		parentResourceType: 'library' | 'album' | 'song' | 'release' | 'track',
		resourceSlugOrId: number | string
	): Promise<void> {
		return API.fetch({
			route: `/tasks/refresh-metadata`,
			errorMessage: "Library refresh failed",
			otherParameters: { [parentResourceType]: resourceSlugOrId },
			parameters: { },
			emptyResponse: true
		});
	}

	static async createLibrary(libraryName: string, libraryPath: string): Promise<Library> {
		return API.fetch({
			route: '/libraries/new',
			data: { name: libraryName, path: libraryPath },
			errorMessage: "Library Creation Failed",
			parameters: {},
			method: 'POST',
			validator: Library
		});
	}

	static async updateLibrary(
		libraryId: number,
		libraryName: string,
		libraryPath: string
	): Promise<Library> {
		return API.fetch({
			route: `/libraries/${libraryId}`,
			data: { name: libraryName, path: libraryPath },
			errorMessage: "Library Update Failed",
			parameters: {},
			method: 'PUT',
			validator: Library
		});
	}

	/**
	 * Delete a library
	 * @returns An empty promise
	 */
	static async deleteLibrary(
		librarySlugOrId: number | string
	): Promise<unknown> {
		return API.fetch({
			route: `/libraries/${librarySlugOrId}`,
			errorMessage: "Library deletion failed",
			parameters: { },
			method: 'DELETE',
			validator: yup.mixed()
		});
	}

	/**
	 * Update Artist Illustration
	 */
	static async updateArtistIllustration(
		artistSlugOrId: number | string,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(artistSlugOrId, illustrationUrl, 'artists');
	}

	/**
	 * Update Release Illustration
	 */
	static async updateReleaseIllustration(
		releaseSlugOrId: number | string,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(releaseSlugOrId, illustrationUrl, 'releases');
	}

	/**
	 * Update Track Illustration
	 */
	static async updateTrackIllustration(
		trackSlugOrId: number | string,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(trackSlugOrId, illustrationUrl, 'tracks');
	}

	/**
	 * Update Track Illustration
	 */
	static async updatePlaylistIllustration(
		playlistSlugOrId: number | string,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(playlistSlugOrId, illustrationUrl, 'playlists');
	}

	/**
	 * Update Resourse Illustration
	 */
	private static async updateResourceIllustration(
		resourceSlugOrId: number | string,
		illustrationUrl: string,
		resourceType: 'artists' | 'releases' | 'tracks' | 'playlists'
	): Promise<unknown> {
		return API.fetch({
			route: `/illustrations/${resourceType}/${resourceSlugOrId}`,
			errorMessage: "Update Illustration Failed",
			method: 'POST',
			parameters: {},
			emptyResponse: true,
			data: { url: illustrationUrl }
		});
	}

	/**
	 * Update Resourse Type
	 */
	static async updateAlbum(
		albumSlugOrId: number | string,
		newType: AlbumType
	): Promise<unknown> {
		return API.fetch({
			route: `/albums/${albumSlugOrId}`,
			errorMessage: "Update Album Failed",
			method: 'POST',
			parameters: {},
			emptyResponse: true,
			data: { type: newType }
		});
	}

	/**
	 * Update Resourse Type
	 */
	static async updateSong(
		songSlugOrId: number | string,
		newType: SongType
	): Promise<void> {
		return API.fetch({
			route: `/songs/${songSlugOrId}`,
			errorMessage: "Update Song Failed",
			method: 'POST',
			parameters: {},
			emptyResponse: true,
			data: { type: newType }
		});
	}

	/**
	 * Fetch all album artists
	 * @returns An InfiniteQuery of Artists
	 */
	static getArtists(
		filter: {
			library?: Identifier, album?: Identifier,
			genre?: Identifier, query?: Identifier
		},
		sort?: SortingParameters<typeof ArtistSortingKeys>
	): InfiniteQuery<Artist> {
		return {
			key: ['artists', ...API.formatObject(filter), ...API.formatObject(sort)],
			exec: (pagination) => API.fetch({
				route: `/artists`,
				errorMessage: 'Artists could not be loaded',
				parameters: { pagination: pagination, include: [], sort },
				otherParameters: { albumArtistOnly: (filter.album ? undefined : 'true'), ...filter },
				validator: PaginatedResponse(Artist)
			}),
		};
	}

	/**
	 * Fetch all albums
	 * @returns An InfiniteQuery of Albums
	 */
	static getAlbums<I extends AlbumInclude>(
		filter: {
			library?: Identifier, artist?: Identifier, genre?: Identifier
			type?: AlbumType, related?: Identifier, appearance?: Identifier,
			query?: Identifier
		},
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include?: I[]
	): InfiniteQuery<AlbumWithRelations<I>> {
		return {
			key: ['albums', ...API.formatObject(filter), ...API.formatObject(sort), ...API.formatIncludeKeys(include)],
			exec: (pagination) => API.fetch({
				route: `/albums`,
				errorMessage: 'Albums could not be loaded',
				parameters: { pagination: pagination, include, sort },
				otherParameters: { ...filter },
				validator: PaginatedResponse(AlbumWithRelations(include ?? []))
			})
		};
	}

	/**
	 * Fetch all releases
	 * @returns An InfiniteQuery of releases
	 */
	static getReleases<I extends ReleaseInclude>(
		filter: { album?: Identifier},
		sort?: SortingParameters<typeof ReleaseSortingKeys>,
		include?: I[]
	): InfiniteQuery<ReleaseWithRelations<I>> {
		return {
			key: ['releases', ...API.formatObject(filter), ...API.formatObject(sort), ...API.formatIncludeKeys(include)],
			exec: (pagination) => API.fetch({
				route: `/releases`,
				errorMessage: 'Releases could not be loaded',
				parameters: { pagination: pagination, include, sort },
				otherParameters: filter,
				validator: PaginatedResponse(ReleaseWithRelations(include ?? []))
			})
		};
	}

	/**
	 * Fetch all songs
	 * @returns An InfiniteQuery of Songs
	 */
	static getSongs<I extends SongInclude>(
		filter: {
			library?: Identifier, type?: SongType, genre?: Identifier,
			artist?: Identifier, query?: string, bsides?: Identifier
		},
		sort?: SortingParameters<typeof SongSortingKeys>,
		include?: I[]
	): InfiniteQuery<SongWithRelations<I>> {
		return {
			key: ['songs', ...API.formatObject(filter), ...API.formatObject(sort), ...API.formatIncludeKeys(include)],
			exec: (pagination) => API.fetch({
				route: `/songs`,
				errorMessage: 'Songs could not be loaded',
				parameters: { pagination: pagination, include, sort },
				otherParameters: { ...filter },
				validator: PaginatedResponse(SongWithRelations(include ?? []))
			})
		};
	}

	/**
	 * Fetch all songs
	 * @returns An InfiniteQuery of Songs
	 */
	static getVideos<I extends SongInclude>(
		filter: {
			library?: Identifier, artist?: Identifier,
			album?: Identifier, song?: Identifier
		},
		sort?: SortingParameters<typeof SongSortingKeys>,
		include?: I[]
	): InfiniteQuery<VideoWithRelations<I>> {
		return {
			key: ['videos', ...API.formatObject(filter), ...API.formatObject(sort), ...API.formatIncludeKeys(include)],
			exec: (pagination) => API.fetch({
				route: `/videos`,
				errorMessage: 'Videos could not be loaded',
				parameters: { pagination: pagination, include, sort },
				otherParameters: filter,
				validator: PaginatedResponse(VideoWithRelations(include ?? []))
			})
		};
	}

	/**
	 * Get a song
	 * @param songSlugOrId the identifier of a song
	 * @returns a Query for a Song
	 */
	static getSong<I extends SongInclude>(
		songSlugOrId: string | number,
		include?: I[]
	): Query<SongWithRelations<I>> {
		return {
			key: ['song', songSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/songs/${songSlugOrId}`,
				parameters: { include },
				validator: SongWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Get the master track of a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Query for a Track
	 */
	static getMasterTrack<I extends TrackInclude>(
		songSlugOrId: string | number,
		include?: I[]
	): Query<TrackWithRelations<I>> {
		return {
			key: ['song', songSlugOrId, 'master', ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/songs/${songSlugOrId}/master`,
				parameters: { include },
				validator: TrackWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Get the track of a song
	 * @param trackId the identifier of a track
	 * @param include the fields to include in the fetched item
	 * @returns a Query for a Track
	 */
	static getTrack<I extends TrackInclude>(
		trackId: string | number,
		include?: I[]
	): Query<TrackWithRelations<I>> {
		return {
			key: ['track', trackId, ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/tracks/${trackId}`,
				parameters: { include },
				validator: TrackWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Get source file of a track
	 * @param sourceFileId the identifier of a file
	 * @param include the fields to include in the fetched item
	 * @returns a Query for a File
	 */
	static getSourceFile(
		sourceFileId: string | number
	): Query<File> {
		return {
			key: ['file', sourceFileId],
			exec: () => API.fetch({
				route: `/files/${sourceFileId}`,
				parameters: { include: [] },
				validator: File
			})
		};
	}

	/**
	 * Get the album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a query for an albums
	 */
	static getAlbum<I extends AlbumInclude>(
		albumSlugOrId: string | number,
		include?: I[]
	): Query<AlbumWithRelations<I>> {
		return {
			key: ['album', albumSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/albums/${albumSlugOrId}`,
				errorMessage: "Album not found",
				parameters: { include },
				validator: AlbumWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Get the User object of the authentified user
	 * @returns A query to a User object
	 */
	static getCurrentUserStatus(): Query<User> {
		const accessToken = store.getState().user.accessToken;

		return {
			key: ['user', accessToken ?? ''],
			exec: () => API.fetch({
				route: `/users/me`,
				parameters: { },
				validator: User
			})
		};
	}

	/**
	 * Fetch all users
	 * @returns An Infinite Query of users
	 */
	static getUsers(
		sort?: SortingParameters<typeof UserSortingKeys>,
	): InfiniteQuery<User> {
		return {
			key: ['users', ...API.formatObject(sort)],
			exec: (pagination) => API.fetch({
				route: `/users`,
				errorMessage: 'Users could not be loaded',
				parameters: { pagination: pagination, include: [], sort },
				validator: PaginatedResponse(User)
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
			parameters: {},
			method: 'PUT',
			validator: User
		});
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
			parameters: {},
			method: 'DELETE',
			validator: User
		});
	}

	/**
	 * Get the master release of an album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a query for a release
	 */
	static getMasterRelease<I extends ReleaseInclude>(
		albumSlugOrId: string | number,
		include?: I[]
	): Query<ReleaseWithRelations<I>> {
		return {
			key: ['album', albumSlugOrId, 'master', ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/albums/${albumSlugOrId}/master`,
				parameters: { include },
				validator: ReleaseWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Get tracks of a song
	 * @param songSlugOrId the id of the parent song
	 * @param include the relation to include
	 * @returns an Infinite Query of tracks
	 */
	static getTracks<I extends TrackInclude>(
		filter: { song?: string | number },
		sort?: SortingParameters<typeof TrackSortingKeys>,
		include?: I[]
	): InfiniteQuery<TrackWithRelations<I>> {
		return {
			key: ['song', ...API.formatObject(filter), ...API.formatObject(sort), ...API.formatIncludeKeys(include)],
			exec: (pagination) => API.fetch({
				route: `/tracks`,
				otherParameters: filter,
				parameters: { pagination: pagination, include, sort },
				validator: PaginatedResponse(TrackWithRelations(include ?? []))
			})
		};
	}

	/**
	 * Get versions of a song
	 * @param songSlugOrId the id of the  song
	 * @param include the relation to include
	 * @returns An Infinite query of Tracks
	 */
	static getSongVersions<I extends SongInclude>(
		songSlugOrId: string | number,
		filter: Parameters<typeof API.getSongs>[0],
		sort?: SortingParameters<typeof SongSortingKeys>,
		include?: I[]
	): InfiniteQuery<SongWithRelations<I>> {
		return {
			key: ['song', songSlugOrId, 'versions', ...API.formatObject(filter), ...API.formatObject(sort), ...API.formatIncludeKeys(include)],
			exec: (pagination) => API.fetch({
				route: `/songs/${songSlugOrId}/versions`,
				parameters: { pagination: pagination, include, sort },
				otherParameters: { filter },
				validator: PaginatedResponse(SongWithRelations(include ?? []))
			})
		};
	}

	/**
	 * Get a release
	 * @param slugOrId the id of the release
	 * @returns A query for a Release
	 */
	static getRelease<I extends ReleaseInclude | never>(
		slugOrId: string | number,
		include?: I[]
	): Query<ReleaseWithRelations<I>> {
		return {
			key: ['release', slugOrId, ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/releases/${slugOrId}`,
				errorMessage: 'Release not found',
				parameters: { include },
				validator: ReleaseWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Get a release's tracklist
	 * @param slugOrId the id of the release
	 * @returns A query for a Tracklist
	 */
	static getReleaseTrackList<I extends TrackInclude>(
		slugOrId: string | number,
		include?: I[]
	) {
		return {
			key: ['release', slugOrId, 'tracklist', ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/releases/${slugOrId.toString()}/tracklist`,
				parameters: { include },
				customValidator: Tracklist(include ?? [])
			})
		};
	}

	/**
	 * Get a release's playlist
	 * @param slugOrId the id of the release
	 * @returns A query for an array of tracks
	 */
	static getReleasePlaylist<I extends TrackInclude>(
		slugOrId: string | number,
		include?: I[]
	): Query<TrackWithRelations<I>[]> {
		return {
			key: ['release', slugOrId, 'playlist', ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/releases/${slugOrId.toString()}/playlist`,
				parameters: { include },
				validator: yup.array(TrackWithRelations(include ?? [])).required()
			})
		};
	}

	/**
	 * Get the song's lyrics
	 * @param slugOrId the id of the song
	 * @returns A query for an array of strings
	 */
	static getSongLyrics(
		slugOrId: string | number
	): Query<string[] | null> {
		return {
			key: ['song', slugOrId, 'lyrics'],
			exec: () => API.fetch({
				route: `/songs/${slugOrId}/lyrics`,
				errorMessage: 'Lyrics loading failed',
				parameters: { },
				customValidator: async (value) => (value as { lyrics: string }).lyrics.split('\n')
			}).catch(() => null)
		};
	}

	/**
	 * Get an artist
	 * @param slugOrId the id of the artist
	 * @returns A query for an Artist
	 */
	static getArtist<I extends ArtistInclude>(
		slugOrId: string | number,
		include: I[] = []
	): Query<ArtistWithRelations<I>> {
		return {
			key: ['artist', slugOrId, ...API.formatIncludeKeys(include)],
			exec: () => API.fetch({
				route: `/artists/${slugOrId}`,
				errorMessage: 'Artist could not be loaded',
				parameters: { include },
				validator: ArtistWithRelations(include ?? [])
			})
		};
	}

	/**
	 * Fetch all genres
	 * @returns An Infinite Query of genres
	 */
	static getGenres(
		filter: { artist?: Identifier, album?: Identifier, song?: Identifier },
		sort?: SortingParameters<typeof ArtistSortingKeys>
	): InfiniteQuery<Genre> {
		return {
			key: ['genres', ...API.formatObject(filter), ...API.formatObject(sort)],
			exec: (pagination) => API.fetch({
				route: `/genres`,
				errorMessage: 'Genres could not be loaded',
				parameters: { pagination: pagination, include: [], sort },
				otherParameters: filter,
				validator: PaginatedResponse(Genre)
			}),
		};
	}

	/**
	 * Get one genre
	 * @param idOrSlug The id of the genre
	 * @returns A query for a Genre
	 */
	static getGenre(idOrSlug: string | number): Query<Genre> {
		return {
			key: ['genre', idOrSlug],
			exec: () => API.fetch({
				route: `/genres/${idOrSlug}`,
				errorMessage: 'Genre not found',
				parameters: {},
				validator: Genre
			})
		};
	}

	private static async fetch<ReturnType, Keys extends readonly string[]>({
		route, parameters, otherParameters,
		errorMessage, data, method, validator, customValidator, emptyResponse
	}: FetchParameters<Keys, ReturnType>): Promise<ReturnType> {
		const accessToken = store.getState().user.accessToken;
		const header = {
			'Content-Type': 'application/json'
		};

		const response = await fetch(
			this.buildURL(route, parameters, otherParameters), {
				method: method ?? 'GET',
				body: data ? JSON.stringify(data) : undefined,
				headers: accessToken ? {
					...header,
					Authorization: `Bearer ${accessToken}`
				} : header,
			}
		);
		const jsonResponse = emptyResponse ? undefined : await response.json().catch(() => {
			throw new Error("Error while parsing Server's response");
		});

		switch (response.status) {
		/// TODO SSR should be disabled if user is not authentified
		case 401:
			if (!isSSR()) {
				throw new Error(jsonResponse.message ?? errorMessage);
			}
			break;
		case 403:
			if (!isSSR()) {
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
		if (emptyResponse) {
			return {} as ReturnType;
		}
		try {
			if (customValidator) {
				return await customValidator(jsonResponse);
			}
			const validated = await validator.validate(jsonResponse);

			return validator.cast(validated);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error(jsonResponse, err);
			throw new Error("Error: Invalid Response Type");
		}
		return jsonResponse;
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
	 * Add song to playlist
	 * @returns Empty Promise
	 */
	static async addSongToPlaylist(songId: number, playlistId: number): Promise<unknown> {
		return API.fetch({
			route: `/playlists/entries/new`,
			errorMessage: 'Failed to add song to playlist',
			parameters: {},
			data: { songId, playlistId },
			method: 'POST',
			emptyResponse: true
		});
	}

	/**
	 * Delete entry in playlist
	 * @returns Empty Promise
	 */
	static async deletePlaylistEntry(entryId: number): Promise<unknown> {
		return API.fetch({
			route: `/playlists/entries/${entryId}`,
			errorMessage: 'Failed to remove song from playlist',
			parameters: {},
			method: 'DELETE',
			emptyResponse: true
		});
	}

	/**
	 * Delete playlist
	 * @returns Empty Promise
	 */
	static async deletePlaylist(playlistSlugOrId: number | string): Promise<unknown> {
		return API.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			errorMessage: 'Failed to remove playlist',
			parameters: {},
			method: 'DELETE',
			emptyResponse: true
		});
	}

	/**
	 * Mark a song as played
	 * To be called when a song ends.
	 * @param songSlugOrId
	 * @returns
	 */
	static async setSongAsPlayed(songSlugOrId: string | number): Promise<unknown> {
		return API.fetch({
			route: `/songs/${songSlugOrId}/played`,
			errorMessage: 'Song update failed',
			parameters: {},
			method: 'PUT',
			validator: yup.mixed()
		});
	}

	/**
	 * Mark a release as master
	 * @param releaseSlugOrId
	 * @returns
	 */
	static async setReleaseAsMaster(releaseSlugOrId: string | number): Promise<unknown> {
		return API.fetch({
			route: `/releases/${releaseSlugOrId}/master`,
			errorMessage: 'Release update failed',
			parameters: {},
			method: 'PUT',
			validator: yup.mixed()
		});
	}

	/**
	 * Mark a track as master
	 * @param trackSlugOrId
	 * @returns
	 */
	static async setTrackAsMaster(trackSlugOrId: string | number): Promise<unknown> {
		return API.fetch({
			route: `/tracks/${trackSlugOrId}/master`,
			errorMessage: 'Track update failed',
			parameters: {},
			method: 'PUT',
			validator: yup.mixed()
		});
	}

	private static buildURL(
		route: string, parameters: QueryParameters<any>, otherParameters?: any
	): string {
		const apiHost = API.isDev() || isSSR() ? this.SSR_API_URL : '/api';

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
		const afterId = pagination.afterId;

		if (afterId !== undefined) {
			formattedParameters.push(`afterId=${afterId}`);
		}
		formattedParameters.push(`take=${pageSize}`);
		return formattedParameters.join('&');
	}
}
