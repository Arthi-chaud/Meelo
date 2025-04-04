/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ResourceNotFound } from "exceptions";
import type { RequireExactlyOne } from "type-fest";
import * as yup from "yup";
import {
	type AlbumInclude,
	type AlbumSortingKeys,
	type AlbumType,
	AlbumWithRelations,
} from "~/models/album";
import {
	type ArtistInclude,
	type ArtistSortingKeys,
	ArtistWithRelations,
} from "~/models/artist";
import {
	AlbumExternalMetadata,
	ArtistExternalMetadata,
	SongExternalMetadata,
} from "~/models/external-metadata";
import File from "~/models/file";
import Genre from "~/models/genre";
import type { GenreSortingKeys } from "~/models/genre";
import Library from "~/models/library";
import { Lyrics } from "~/models/lyrics";
import PaginatedResponse, {
	type PaginationParameters,
} from "~/models/pagination";
import Playlist, {
	PlaylistEntryWithRelations,
	type PlaylistInclude,
	type PlaylistSortingKeys,
	PlaylistWithRelations,
} from "~/models/playlist";
import {
	type ReleaseInclude,
	type ReleaseSortingKeys,
	ReleaseWithRelations,
} from "~/models/release";
import {
	type SaveSearchItem,
	type SearchResult,
	SearchResultTransformer,
} from "~/models/search";
import {
	type SongInclude,
	type SongSortingKeys,
	type SongType,
	SongWithRelations,
} from "~/models/song";
import {
	type SongGroupSortingKeys,
	SongGroupWithRelations,
} from "~/models/song-group";
import { TaskResponse } from "~/models/task";
import {
	type TrackInclude,
	type TrackSortingKeys,
	type TrackType,
	TrackWithRelations,
} from "~/models/track";
import { TracklistItemWithRelations } from "~/models/tracklist";
import User, { type UserSortingKeys } from "~/models/user";
import {
	type VideoInclude,
	type VideoSortingKeys,
	type VideoType,
	VideoWithRelations,
} from "~/models/video";
import { store } from "~/state/store";
import { accessTokenAtom } from "~/state/user";
import { isSSR } from "~/utils/is-ssr";
import type { SortingParameters } from "~/utils/sorting";
import type { InfiniteQuery, Query } from "./use-query";

const AuthenticationResponse = yup.object({
	access_token: yup.string().required(),
});

type Identifier = number | string;

type AuthenticationResponse = yup.InferType<typeof AuthenticationResponse>;

type QueryParameters<Keys extends readonly string[]> = {
	pagination?: PaginationParameters;
	include?: string[];
	sort?: SortingParameters<Keys>;
};

type AuthenticationInput = {
	username: string;
	password: string;
};

enum Service {
	API = 0,
	Scanner = 1,
}

type FetchParameters<Keys extends readonly string[], ReturnType> = {
	route: string;
	parameters: QueryParameters<Keys>;
	otherParameters?: any;
	errorMessage?: string;
	service?: Service;
	data?: Record<string, any>;
	method?: "GET" | "PUT" | "POST" | "DELETE";
} & RequireExactlyOne<{
	emptyResponse: true;
	validator: yup.Schema<ReturnType>;
	customValidator: (value: unknown) => Promise<ReturnType>;
}>;

// biome-ignore lint/complexity/noStaticOnlyClass: OK
export default class API {
	/**
	 * Formats an array of include keys for Query keys
	 */
	private static formatIncludeKeys = (includes?: string[]) =>
		includes?.map((include) => `include-${include}`) ?? [];
	private static formatObject = (includes?: object) =>
		includes
			? Object.entries(includes)
					.filter(
						([_, value]) =>
							value !== null &&
							value !== undefined &&
							value !== "view" &&
							(Array.isArray(value) ? value.length > 0 : true),
					)
					.map(([key, value]) => `params-${key}-${value}`)
			: [];

	private static isDev = () => process.env.NODE_ENV === "development";
	private static SSR_API_URL =
		process.env.SSR_SERVER_URL ?? process.env.PUBLIC_SERVER_URL!;
	private static SSR_SCANNER_URL =
		process.env.SSR_SCANNER_URL ?? process.env.PUBLIC_SCANNER_URL!;
	static defaultPageSize = 35;

	/**
	 * @param credentials the credentials of the user to authenticate
	 * @returns An object holding the access token to use for authenticated requests
	 */
	static async login(
		credentials: AuthenticationInput,
	): Promise<AuthenticationResponse> {
		return API.fetch({
			route: "/auth/login",
			data: credentials,
			errorMessage: "Username or password is incorrect",
			parameters: {},
			method: "POST",
			validator: AuthenticationResponse,
		});
	}

	/**
	 * Creates a new user
	 * @param credentials the credentails of the new user
	 * @returns The newly created user
	 */
	static async register(credentials: AuthenticationInput): Promise<User> {
		return API.fetch({
			route: "/users",
			data: {
				name: credentials.username,
				password: credentials.password,
			},
			parameters: {},
			method: "POST",
			validator: User,
		});
	}

	/**
	 * Fetch all libraries
	 * @returns An InfiniteQuery of Libraries
	 */
	static getTasks() {
		return {
			key: ["tasks"],
			exec: () =>
				API.fetch({
					route: "/tasks",
					errorMessage: "Tasks could not be loaded",
					parameters: {},
					service: Service.Scanner,
					validator: yup.object({
						current_task: yup.string().required().nullable(),
						progress: yup.number().required().nullable(),
						pending_tasks: yup
							.array(yup.string().required())
							.required(),
					}),
				}),
		};
	}

	/**
	 * Fetch all libraries
	 * @returns An InfiniteQuery of Libraries
	 */
	static getLibraries(): InfiniteQuery<Library> {
		return {
			key: ["libraries"],
			exec: (pagination) =>
				API.fetch({
					route: "/libraries",
					errorMessage: "Libraries could not be loaded",
					parameters: { pagination: pagination, include: [] },
					validator: PaginatedResponse(Library),
				}),
		};
	}

	/**
	 * Fetch all playlists
	 * @returns An InfiniteQuery of playlists
	 */
	static getPlaylists<I extends PlaylistInclude | never = never>(
		filter: { album?: Identifier },
		sort?: SortingParameters<typeof PlaylistSortingKeys>,
		include?: I[],
	): InfiniteQuery<PlaylistWithRelations<I>> {
		return {
			key: [
				"playlists",
				...API.formatObject(sort),
				...API.formatObject(filter),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/playlists",
					errorMessage: "Playlists could not be loaded",
					parameters: { pagination: pagination, include, sort },
					otherParameters: filter,
					validator: PaginatedResponse(
						PlaylistWithRelations(include ?? []),
					),
				}),
		};
	}

	static async createPlaylist(playlistName: string): Promise<Playlist> {
		return API.fetch({
			route: "/playlists",
			data: { name: playlistName },
			errorMessage: "Playlist Creation Failed",
			parameters: {},
			method: "POST",
			validator: Playlist,
		});
	}

	static async updatePlaylist(
		playlistName: string,
		playlistSlugOrId: number | string,
	): Promise<Playlist> {
		return API.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			data: { name: playlistName },
			parameters: {},
			method: "PUT",
			validator: Playlist,
		});
	}

	static async reorderPlaylist(
		playlistSlugOrId: number | string,
		entriesIds: number[],
	): Promise<void> {
		return API.fetch({
			route: `/playlists/${playlistSlugOrId}/entries/reorder`,
			data: { entryIds: entriesIds },
			parameters: {},
			method: "PUT",
			emptyResponse: true,
		});
	}

	/**
	 * Fetch one playlist
	 * @returns An query for a playlist
	 */
	static getPlaylist<I extends PlaylistInclude | never = never>(
		playlistSlugOrId: string | number,
		include?: I[],
	): Query<PlaylistWithRelations<I>> {
		return {
			key: [
				"playlist",
				playlistSlugOrId,
				...API.formatIncludeKeys(include),
			],
			exec: () =>
				API.fetch({
					route: `/playlists/${playlistSlugOrId}`,
					parameters: { include },
					validator: PlaylistWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Fetch all entries in a playlist
	 * @returns An InfiniteQuery of Songs
	 */
	static getPlaylistEntires<I extends SongInclude | never = never>(
		playlistSlugOrId: string | number,
		include?: I[],
	): InfiniteQuery<PlaylistEntryWithRelations<I>> {
		return {
			key: [
				"playlist",
				playlistSlugOrId,
				"entries",
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: `/playlists/${playlistSlugOrId}/entries`,
					errorMessage: "Songs could not be loaded",
					parameters: { pagination: pagination, include },
					otherParameters: {},
					validator: PaginatedResponse(
						PlaylistEntryWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Calls for a task to clean all libraries
	 * @returns A object with the status of the task
	 */
	static async cleanLibraries(): Promise<TaskResponse> {
		return API.fetch({
			route: "/clean",
			errorMessage: "Library clean failed",
			parameters: {},
			service: Service.Scanner,
			method: "POST",
			validator: TaskResponse,
		});
	}

	/**
	 * Calls for a task to scan a library
	 * @returns A object with the status of the task
	 */
	static async scanLibrary(
		librarySlugOrId: number | string,
	): Promise<TaskResponse> {
		return API.fetch({
			route: `/scan/${librarySlugOrId}`,
			errorMessage: "Library scan failed",
			parameters: {},
			service: Service.Scanner,
			method: "POST",
			validator: TaskResponse,
		});
	}

	/**
	 * Calls for a task to clean a library
	 * @returns A object with the status of the task
	 */
	static async cleanLibrary(
		librarySlugOrId: number | string,
	): Promise<TaskResponse> {
		return API.fetch({
			route: `/clean/${librarySlugOrId}`,
			errorMessage: "Library clean failed",
			parameters: {},
			service: Service.Scanner,
			method: "POST",
			validator: TaskResponse,
		});
	}

	/**
	 * Calls for a task to scan all libraries
	 * @returns the status of the task
	 */
	static scanLibraries(): Promise<TaskResponse> {
		return API.fetch<TaskResponse, []>({
			route: "/scan",
			parameters: {},
			service: Service.Scanner,
			method: "POST",
			validator: TaskResponse,
		});
	}

	/**
	 * Calls for a task to refresh metadata of files in a library
	 * @returns A object with the status of the task
	 */
	static async refreshMetadata(
		parentResourceType: "library" | "album" | "song" | "release" | "track",
		resourceSlugOrId: number | string,
		force: boolean,
	): Promise<void> {
		return API.fetch({
			method: "POST",
			route: "/refresh",
			errorMessage: "Metadata Refresh request failed",
			otherParameters: { [parentResourceType]: resourceSlugOrId, force },
			parameters: {},
			service: Service.Scanner,
			emptyResponse: true,
		});
	}

	static async createLibrary(
		libraryName: string,
		libraryPath: string,
	): Promise<Library> {
		return API.fetch({
			route: "/libraries",
			data: { name: libraryName, path: libraryPath },
			parameters: {},
			method: "POST",
			validator: Library,
		});
	}

	static async updateLibrary(
		libraryId: number,
		libraryName: string,
		libraryPath: string,
	): Promise<Library> {
		return API.fetch({
			route: `/libraries/${libraryId}`,
			data: { name: libraryName, path: libraryPath },
			errorMessage: "Library Update Failed",
			parameters: {},
			method: "PUT",
			validator: Library,
		});
	}

	/**
	 * Delete a library
	 * @returns An empty promise
	 */
	static async deleteLibrary(
		librarySlugOrId: number | string,
	): Promise<unknown> {
		return API.fetch({
			route: `/libraries/${librarySlugOrId}`,
			errorMessage: "Library deletion failed",
			parameters: {},
			method: "DELETE",
			validator: yup.mixed(),
		});
	}

	/**
	 * Update Artist Illustration
	 */
	static async updateArtistIllustration(
		artistId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(
			artistId,
			illustrationUrl,
			"artist",
		);
	}

	/**
	 * Update Release Illustration
	 */
	static async updateReleaseIllustration(
		releaseId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(
			releaseId,
			illustrationUrl,
			"release",
		);
	}

	/**
	 * Update Track Illustration
	 */
	static async updateTrackIllustration(
		trackId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(
			trackId,
			illustrationUrl,
			"track",
		);
	}

	/**
	 * Update Track Illustration
	 */
	static async updatePlaylistIllustration(
		playlistId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return API.updateResourceIllustration(
			playlistId,
			illustrationUrl,
			"playlist",
		);
	}

	/**
	 * Update Resourse Illustration
	 */
	private static async updateResourceIllustration(
		resourceId: number,
		illustrationUrl: string,
		resourceType: "artist" | "release" | "track" | "playlist",
	): Promise<unknown> {
		return API.fetch({
			route: "/illustrations/url",
			errorMessage: "Update Illustration Failed",
			method: "POST",
			parameters: {},
			emptyResponse: true,
			data: { url: illustrationUrl, [`${resourceType}Id`]: resourceId },
		});
	}

	/**
	 * Update Resourse Type
	 */
	static async updateAlbum(
		albumSlugOrId: number | string,
		dto: Partial<{ type: AlbumType; masterReleaseId: number }>,
	): Promise<void> {
		return API.fetch({
			route: `/albums/${albumSlugOrId}`,
			errorMessage: "Update Album Failed",
			method: "PUT",
			parameters: {},
			emptyResponse: true,
			data: dto,
		});
	}

	/**
	 * Update Resourse Type
	 */
	static async updateSong(
		songSlugOrId: number | string,
		dto: Partial<{ type: SongType; masterTrackId: number }>,
	): Promise<void> {
		return API.fetch({
			route: `/songs/${songSlugOrId}`,
			errorMessage: "Update Song Failed",
			method: "PUT",
			parameters: {},
			emptyResponse: true,
			data: dto,
		});
	}

	static async updateVideo(
		videoSlugOrId: number | string,
		dto: Partial<{ type: VideoType; masterTrackId: number }>,
	): Promise<void> {
		return API.fetch({
			route: `/videos/${videoSlugOrId}`,
			errorMessage: "Update Video Failed",
			method: "PUT",
			parameters: {},
			emptyResponse: true,
			data: dto,
		});
	}

	/**
	 * Fetch all album artists
	 * @returns An InfiniteQuery of Artists
	 */
	static getArtists<I extends ArtistInclude | never = never>(
		filter: {
			library?: Identifier[];
			album?: Identifier;
			genre?: Identifier;
			query?: Identifier;
		},
		sort?: SortingParameters<typeof ArtistSortingKeys>,
		include: I[] = [],
	): InfiniteQuery<ArtistWithRelations<I>> {
		return {
			key: [
				"artists",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/artists",
					errorMessage: "Artists could not be loaded",
					parameters: { pagination: pagination, include, sort },
					otherParameters: {
						albumArtistOnly: filter.album ? undefined : "true",
						...filter,
						library: API.formatOr(filter.library),
					},
					validator: PaginatedResponse(
						ArtistWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Fetch all albums
	 * @returns An InfiniteQuery of Albums
	 */
	static getAlbums<I extends AlbumInclude | never = never>(
		filter: {
			library?: Identifier[];
			artist?: Identifier;
			genre?: Identifier;
			type?: AlbumType[];
			related?: Identifier;
			appearance?: Identifier;
			query?: Identifier;
			random?: number;
		},
		sort?: SortingParameters<typeof AlbumSortingKeys>,
		include?: I[],
	): InfiniteQuery<AlbumWithRelations<I>> {
		return {
			key: [
				"albums",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/albums",
					errorMessage: "Albums could not be loaded",
					parameters: { pagination: pagination, include, sort },
					otherParameters: {
						...filter,
						library: API.formatOr(filter.library),
						type: API.formatOr(filter.type),
					},
					validator: PaginatedResponse(
						AlbumWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Fetch all releases
	 * @returns An InfiniteQuery of releases
	 */
	static getReleases<I extends ReleaseInclude | never = never>(
		filter: { album?: Identifier },
		sort?: SortingParameters<typeof ReleaseSortingKeys>,
		include?: I[],
	): InfiniteQuery<ReleaseWithRelations<I>> {
		return {
			key: [
				"releases",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/releases",
					errorMessage: "Releases could not be loaded",
					parameters: { pagination: pagination, include, sort },
					otherParameters: filter,
					validator: PaginatedResponse(
						ReleaseWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Fetch all songs
	 * @returns An InfiniteQuery of Songs
	 */
	static getSongs<I extends SongInclude | never = never>(
		filter: {
			library?: Identifier[];
			type?: SongType[];
			genre?: Identifier;
			artist?: Identifier;
			versionsOf?: Identifier;
			rare?: Identifier;
			query?: string;
			bsides?: Identifier;
			random?: number;
		},
		sort?: SortingParameters<typeof SongSortingKeys>,
		include?: I[],
	): InfiniteQuery<SongWithRelations<I>> {
		return {
			key: [
				"songs",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/songs",
					errorMessage: "Songs could not be loaded",
					parameters: { pagination: pagination, include, sort },
					otherParameters: {
						...filter,
						library: API.formatOr(filter.library),
						type: API.formatOr(filter.type),
					},
					validator: PaginatedResponse(
						SongWithRelations(include ?? []),
					),
				}),
		};
	}

	static getSongGroups<I extends SongInclude | never = never>(
		filter: {
			library?: Identifier[];
			genre?: Identifier;
			artist?: Identifier;
			query?: string;
			type?: SongType;
		},
		sort?: SortingParameters<typeof SongGroupSortingKeys>,
		include?: I[],
	): InfiniteQuery<SongGroupWithRelations<I>> {
		return {
			key: [
				"song-groups",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/song-groups",
					errorMessage: "Songs could not be loaded",
					parameters: { pagination: pagination, include, sort },
					otherParameters: {
						...filter,
						library: API.formatOr(filter.library),
					},
					validator: PaginatedResponse(
						SongGroupWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * @returns An InfiniteQuery of Videos
	 */
	static getVideos<I extends VideoInclude | never = never>(
		filter: {
			library?: Identifier[];
			artist?: Identifier;
			album?: Identifier;
			song?: Identifier;
			group?: Identifier;
			random?: number;
			type?: VideoType[];
			query?: string;
		},
		sort?: SortingParameters<typeof VideoSortingKeys>,
		include?: I[],
	): InfiniteQuery<VideoWithRelations<I>> {
		return {
			key: [
				"videos",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/videos",
					errorMessage: "Videos could not be loaded",
					parameters: {
						pagination: pagination,
						include,
						sort,
					},
					otherParameters: {
						...filter,
						library: API.formatOr(filter.library),
						type: API.formatOr(filter.type),
					},
					validator: PaginatedResponse(
						VideoWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Get a song
	 * @param songSlugOrId the identifier of a song
	 * @returns a Query for a Song
	 */
	static getSong<I extends SongInclude | never = never>(
		songSlugOrId: string | number,
		include?: I[],
	): Query<SongWithRelations<I>> {
		return {
			key: ["song", songSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				API.fetch({
					route: `/songs/${songSlugOrId}`,
					parameters: { include },
					validator: SongWithRelations(include ?? []),
				}),
		};
	}

	static getVideo<I extends VideoInclude | never = never>(
		videoSlugOrId: string | number,
		include?: I[],
	): Query<VideoWithRelations<I>> {
		return {
			key: ["video", videoSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				API.fetch({
					route: `/videos/${videoSlugOrId}`,
					parameters: { include },
					validator: VideoWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Get the master track of a song
	 * @param songSlugOrId the identifier of a song
	 * @param include the fields to include in the fetched item
	 * @returns a Query for a Track
	 */
	static getSongMasterTrack<I extends TrackInclude | never = never>(
		songSlugOrId: string | number,
		include?: I[],
	): Query<TrackWithRelations<I>> {
		return {
			key: [
				"song",
				songSlugOrId,
				"master",
				...API.formatIncludeKeys(include),
			],
			exec: () =>
				API.fetch({
					route: `/tracks/master/song/${songSlugOrId}`,
					parameters: { include },
					validator: TrackWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Get the track of a song
	 * @param trackId the identifier of a track
	 * @param include the fields to include in the fetched item
	 * @returns a Query for a Track
	 */
	static getTrack<I extends TrackInclude | never = never>(
		trackId: string | number,
		include?: I[],
	): Query<TrackWithRelations<I>> {
		return {
			key: ["track", trackId, ...API.formatIncludeKeys(include)],
			exec: () =>
				API.fetch({
					route: `/tracks/${trackId}`,
					parameters: { include },
					validator: TrackWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Get source file of a track
	 * @param sourceFileId the identifier of a file
	 * @param include the fields to include in the fetched item
	 * @returns a Query for a File
	 */
	static getSourceFile(sourceFileId: string | number): Query<File> {
		return {
			key: ["file", sourceFileId],
			exec: () =>
				API.fetch({
					route: `/files/${sourceFileId}`,
					parameters: { include: [] },
					validator: File,
				}),
		};
	}

	/**
	 * Get the album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a query for an albums
	 */
	static getAlbum<I extends AlbumInclude | never = never>(
		albumSlugOrId: string | number,
		include?: I[],
	): Query<AlbumWithRelations<I>> {
		return {
			key: ["album", albumSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				API.fetch({
					route: `/albums/${albumSlugOrId}`,
					errorMessage: "Album not found",
					parameters: { include },
					validator: AlbumWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Search artists, albums and songs, all at once
	 */
	static searchAll(query: string): Query<SearchResult[]> {
		return {
			key: ["search", query],
			exec: () =>
				API.fetch({
					route: "/search",
					errorMessage: "Search failed",
					parameters: {},
					otherParameters: { query },
					customValidator: SearchResultTransformer,
				}),
		};
	}

	static getSearchHistory(): Query<SearchResult[]> {
		return {
			key: ["search-history-items"],
			exec: () =>
				API.fetch({
					route: "/search/history",
					errorMessage: "Getting Search History failed",
					parameters: {},
					customValidator: SearchResultTransformer,
				}),
		};
	}

	/**
	 * Search artists, albums and songs, all at once
	 */
	static saveSearchHistoryEntry(resource: SaveSearchItem): Promise<void> {
		return API.fetch({
			method: "POST",
			route: "/search/history",
			errorMessage: "Saving Search History failed",
			parameters: {},
			data: resource,
			emptyResponse: true,
		});
	}

	/**
	 * Get the User object of the authentified user
	 * @returns A query to a User object
	 */
	static getCurrentUserStatus(): Query<User> {
		const accessToken = store.get(accessTokenAtom);

		return {
			key: ["user", accessToken ?? ""],
			exec: () =>
				API.fetch({
					route: "/users/me",
					parameters: {},
					validator: User,
				}),
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
			key: ["users", ...API.formatObject(sort)],
			exec: (pagination) =>
				API.fetch({
					route: "/users",
					errorMessage: "Users could not be loaded",
					parameters: { pagination: pagination, include: [], sort },
					validator: PaginatedResponse(User),
				}),
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
		updatedFields: Partial<Pick<User, "admin" | "enabled">>,
	): Promise<User> {
		return API.fetch({
			route: `/users/${userId}`,
			errorMessage: "User could not be updated",
			data: updatedFields,
			parameters: {},
			method: "PUT",
			validator: User,
		});
	}

	/**
	 * Delete user
	 * @param userId the id of the user to delete
	 */
	static async deleteUser(userId: number): Promise<User> {
		return API.fetch({
			route: `/users/${userId}`,
			errorMessage: "User could not be deleted",
			parameters: {},
			method: "DELETE",
			validator: User,
		});
	}

	/**
	 * Get the master release of an album
	 * @param albumSlugOrId the identifier of an album
	 * @param include the fields to include in the fetched item
	 * @returns a query for a release
	 */
	static getMasterRelease<I extends ReleaseInclude | never = never>(
		albumSlugOrId: string | number,
		include?: I[],
	): Query<ReleaseWithRelations<I>> {
		return {
			key: [
				"album",
				albumSlugOrId,
				"master",
				...API.formatIncludeKeys(include),
			],
			exec: () =>
				API.fetch({
					route: `/releases/master/${albumSlugOrId}`,
					parameters: { include },
					validator: ReleaseWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Get tracks of a song
	 * @param songSlugOrId the id of the parent song
	 * @param include the relation to include
	 * @returns an Infinite Query of tracks
	 */
	static getTracks<I extends TrackInclude | never = never>(
		filter: { song?: string | number; library?: Identifier[] },
		sort?: SortingParameters<typeof TrackSortingKeys>,
		include?: I[],
	): InfiniteQuery<TrackWithRelations<I>> {
		return {
			key: [
				"song",
				...API.formatObject(filter),
				...API.formatObject(sort),
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/tracks",
					otherParameters: {
						...filter,
						library: API.formatOr(filter.library),
					},
					parameters: { pagination: pagination, include, sort },
					validator: PaginatedResponse(
						TrackWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Get a release
	 * @param slugOrId the id of the release
	 * @returns A query for a Release
	 */
	static getRelease<I extends ReleaseInclude | never = never>(
		slugOrId: string | number,
		include?: I[],
	): Query<ReleaseWithRelations<I>> {
		return {
			key: ["release", slugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				API.fetch({
					route: `/releases/${slugOrId}`,
					errorMessage: "Release not found",
					parameters: { include },
					validator: ReleaseWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Get a release's tracklist
	 * @param slugOrId the id of the release
	 * @returns A query for a Tracklist
	 */
	static getReleaseTracklist<I extends SongInclude | never = never>(
		slugOrId: string | number,
		exclusiveOnly = false,
		include?: I[],
	): InfiniteQuery<TracklistItemWithRelations<I>> {
		return {
			key: [
				"release",
				slugOrId,
				"tracklist",
				exclusiveOnly ? "exclusives" : "",
				...API.formatIncludeKeys(include),
			],
			exec: (pagination) =>
				API.fetch({
					route: `/releases/${slugOrId.toString()}/tracklist`,
					parameters: { include, pagination },
					otherParameters: { exclusive: exclusiveOnly },
					validator: PaginatedResponse(
						TracklistItemWithRelations(include ?? []),
					),
				}),
		};
	}

	/**
	 * Get the song's lyrics
	 * @param slugOrId the id of the song
	 * @returns A query for an array of strings
	 */
	static getSongLyrics(slugOrId: string | number): Query<Lyrics | null> {
		return {
			key: ["song", slugOrId, "lyrics"],
			exec: () =>
				API.fetch({
					route: `/songs/${slugOrId}/lyrics`,
					errorMessage: "Lyrics loading failed",
					parameters: {},
					validator: Lyrics,
				}).catch(() => null),
		};
	}

	/**
	 * Get an artist
	 * @param slugOrId the id of the artist
	 * @returns A query for an Artist
	 */
	static getArtist<I extends ArtistInclude | never = never>(
		slugOrId: string | number,
		include: I[] = [],
	): Query<ArtistWithRelations<I>> {
		return {
			key: ["artist", slugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				API.fetch({
					route: `/artists/${slugOrId}`,
					errorMessage: "Artist could not be loaded",
					parameters: { include },
					validator: ArtistWithRelations(include ?? []),
				}),
		};
	}

	/**
	 * Fetch all genres
	 * @returns An Infinite Query of genres
	 */
	static getGenres(
		filter: { artist?: Identifier; album?: Identifier; song?: Identifier },
		sort?: SortingParameters<typeof GenreSortingKeys>,
	): InfiniteQuery<Genre> {
		return {
			key: [
				"genres",
				...API.formatObject(filter),
				...API.formatObject(sort),
			],
			exec: (pagination) =>
				API.fetch({
					route: "/genres",
					errorMessage: "Genres could not be loaded",
					parameters: { pagination: pagination, include: [], sort },
					otherParameters: filter,
					validator: PaginatedResponse(Genre),
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
			key: ["genre", idOrSlug],
			exec: () =>
				API.fetch({
					route: `/genres/${idOrSlug}`,
					errorMessage: "Genre not found",
					parameters: {},
					validator: Genre,
				}),
		};
	}

	static getArtistExternalMetadata(
		slugOrId: string | number,
	): Query<ArtistExternalMetadata | null> {
		return API.getResourceExternalMetadata(
			slugOrId,
			"artist",
			ArtistExternalMetadata,
		);
	}

	static getSongExternalMetadata(
		slugOrId: string | number,
	): Query<SongExternalMetadata | null> {
		return API.getResourceExternalMetadata(
			slugOrId,
			"song",
			SongExternalMetadata,
		);
	}
	static getAlbumExternalMetadata(
		slugOrId: string | number,
	): Query<AlbumExternalMetadata | null> {
		return API.getResourceExternalMetadata(
			slugOrId,
			"album",
			AlbumExternalMetadata,
		);
	}

	static getResourceExternalMetadata<T, V extends yup.Schema<T>>(
		resourceSlugOrId: string | number,
		resourceType: "artist" | "album" | "song",
		validator: V,
	): Query<T | null> {
		return {
			key: [resourceType, resourceSlugOrId, "external-metadata"],
			exec: () =>
				API.fetch({
					route: `/external-metadata?${resourceType}=${resourceSlugOrId}`,
					errorMessage: "Metadata could not be loaded",
					parameters: {},
					validator: validator,
				}).catch(() => null),
		};
	}

	private static async fetch<ReturnType, Keys extends readonly string[]>({
		route,
		parameters,
		otherParameters,
		errorMessage,
		data,
		method,
		validator,
		customValidator,
		emptyResponse,
		service,
	}: FetchParameters<Keys, ReturnType>): Promise<ReturnType> {
		const accessToken = store.get(accessTokenAtom);
		const header = {
			"Content-Type": "application/json",
		};

		const response = await fetch(
			API.buildURL(route, parameters, otherParameters, service),
			{
				method: method ?? "GET",
				body: data ? JSON.stringify(data) : undefined,
				headers: accessToken
					? {
							...header,
							Authorization: `Bearer ${accessToken}`,
						}
					: header,
			},
		);
		const jsonResponse = emptyResponse
			? undefined
			: await response.json().catch(() => {
					throw new Error("Error while parsing Server's response");
				});

		switch (response.status) {
			case 401:
				throw new Error(jsonResponse.message ?? errorMessage);
			case 403:
				throw new Error(
					errorMessage ?? "Unauthorized: Only for admins",
				);
			case 404:
				throw new ResourceNotFound(
					errorMessage ?? jsonResponse.message ?? response.statusText,
				);
			default:
				if (!response.ok) {
					throw new Error(
						errorMessage ??
							jsonResponse.message ??
							response.statusText,
					);
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
			// biome-ignore lint/suspicious/noConsole: OK for debugging
			console.error(jsonResponse, err);
			throw new Error("Error: Invalid Response Type");
		}
	}

	/**
	 * Builds the URL to fetch an illustration, from the browser/client pov
	 * @param imageURL
	 * @returns the correct, rerouted URL
	 */
	static getIllustrationURL(imageURL: string): string {
		if (API.isDev()) {
			return `${"/api"}${imageURL}`;
		}
		return `${process.env.PUBLIC_SERVER_URL ?? "/api"}${imageURL}`;
	}

	static getDirectStreamURL(fileId: number): string {
		return API.buildURL(`/stream/${fileId}/direct`, {});
	}
	static getTranscodeStreamURL(fileId: number, type: TrackType): string {
		if (type === "Video") {
			return API.buildURL(`/stream/${fileId}/master.m3u8`, {});
		}
		return API.buildURL(`/stream/${fileId}/audio/0/index.m3u8`, {});
	}

	/**
	 * Builds the URL to get an archive of a given release
	 * @param releaseId slug or id of the release
	 * @returns the correct, rerouted URL
	 */
	static getReleaseArchiveURL(releaseId: number | string): string {
		return API.buildURL(`/releases/${releaseId}/archive`, {});
	}

	/**
	 * Add song to playlist
	 * @returns Empty Promise
	 */
	static async addSongToPlaylist(
		songId: number,
		playlistId: number,
	): Promise<unknown> {
		return API.fetch({
			route: `/playlists/${playlistId}/entries`,
			errorMessage: "Failed to add song to playlist",
			parameters: {},
			data: { songId },
			method: "POST",
			emptyResponse: true,
		});
	}

	/**
	 * Delete entry in playlist
	 * @returns Empty Promise
	 */
	static async deletePlaylistEntry(entryId: number): Promise<unknown> {
		return API.fetch({
			route: `/playlists/entries/${entryId}`,
			errorMessage: "Failed to remove song from playlist",
			parameters: {},
			method: "DELETE",
			emptyResponse: true,
		});
	}

	/**
	 * Delete playlist
	 * @returns Empty Promise
	 */
	static async deletePlaylist(
		playlistSlugOrId: number | string,
	): Promise<unknown> {
		return API.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			errorMessage: "Failed to remove playlist",
			parameters: {},
			method: "DELETE",
			emptyResponse: true,
		});
	}

	/**
	 * Mark a song as played
	 * To be called when a song ends.
	 * @param songSlugOrId
	 * @returns
	 */
	static async setSongAsPlayed(
		songSlugOrId: string | number,
	): Promise<unknown> {
		return API.fetch({
			route: `/songs/${songSlugOrId}/played`,
			errorMessage: "Song update failed",
			parameters: {},
			method: "PUT",
			validator: yup.mixed(),
		});
	}

	private static buildURL(
		route: string,
		parameters: QueryParameters<any>,
		otherParameters?: any,
		service: Service = Service.API,
	): string {
		const apiHost = isSSR() ? API.SSR_API_URL : "/api";
		const scannerHost = isSSR() ? API.SSR_SCANNER_URL : "/scanner";

		return `${
			service === Service.API ? apiHost : scannerHost
		}${route}${API.formatQueryParameters(parameters, otherParameters)}`;
	}

	private static formatQueryParameters<Keys extends string[]>(
		parameters: QueryParameters<Keys>,
		otherParameters?: any,
	): string {
		const formattedQueryParams: string[] = [];

		if (parameters.sort) {
			formattedQueryParams.push(`sortBy=${parameters.sort.sortBy}`);
			formattedQueryParams.push(
				`order=${parameters.sort.order ?? "asc"}`,
			);
		}
		if ((parameters.include?.length ?? 0) !== 0) {
			formattedQueryParams.push(API.formatInclude(parameters.include!)!);
		}
		if (parameters.pagination) {
			formattedQueryParams.push(
				API.formatPagination(parameters.pagination),
			);
		}
		for (const otherParams in otherParameters) {
			if (otherParameters[otherParams] !== undefined) {
				formattedQueryParams.push(
					`${encodeURIComponent(otherParams)}=${encodeURIComponent(
						otherParameters[otherParams],
					)}`,
				);
			}
		}
		if (formattedQueryParams.length === 0) {
			return "";
		}
		return `?${formattedQueryParams.join("&")}`;
	}

	private static formatInclude(include: string[]): string | null {
		if (include.length === 0) {
			return null;
		}
		return `with=${include.join(",")}`;
	}

	private static formatPagination(pagination: PaginationParameters): string {
		const formattedParameters: string[] = [];
		const pageSize = pagination.pageSize ?? API.defaultPageSize;
		const afterId = pagination.afterId;

		if (afterId !== undefined) {
			formattedParameters.push(`afterId=${afterId}`);
		}
		formattedParameters.push(`take=${pageSize}`);
		return formattedParameters.join("&");
	}

	private static formatOr(
		items: (string | number)[] | undefined,
	): string | undefined {
		if (!items || items.length === 0) {
			return undefined;
		}
		if (items.length === 1) {
			return items[0].toString();
		}
		return `or:${items.map((i) => i.toString()).join(",")}`;
	}
}
