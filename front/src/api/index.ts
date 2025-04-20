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
import type { InfiniteQuery, Query } from "./query";

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

type APIUrls = {
	api: Record<"ssr" | "csr", string>;
	scanner: Record<"ssr" | "csr", string>;
};

export default class API {
	constructor(
		private readonly accessToken: string | null,
		private readonly urls: APIUrls,
		private readonly isDev = false,
		public readonly pageSize = API.DefaultPageSize,
	) {}
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

	public static DefaultPageSize = 35;

	/**
	 * @param credentials the credentials of the user to authenticate
	 * @returns An object holding the access token to use for authenticated requests
	 */
	async login(
		credentials: AuthenticationInput,
	): Promise<AuthenticationResponse> {
		return this.fetch({
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
	async register(credentials: AuthenticationInput): Promise<User> {
		return this.fetch({
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
	getTasks() {
		return {
			key: ["tasks"],
			exec: () =>
				this.fetch({
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
	getLibraries(): InfiniteQuery<Library> {
		return {
			key: ["libraries"],
			exec: (pagination) =>
				this.fetch({
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
	getPlaylists<I extends PlaylistInclude | never = never>(
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
				this.fetch({
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

	async createPlaylist(playlistName: string): Promise<Playlist> {
		return this.fetch({
			route: "/playlists",
			data: { name: playlistName },
			errorMessage: "Playlist Creation Failed",
			parameters: {},
			method: "POST",
			validator: Playlist,
		});
	}

	async updatePlaylist(
		playlistName: string,
		playlistSlugOrId: number | string,
	): Promise<Playlist> {
		return this.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			data: { name: playlistName },
			parameters: {},
			method: "PUT",
			validator: Playlist,
		});
	}

	async reorderPlaylist(
		playlistSlugOrId: number | string,
		entriesIds: number[],
	): Promise<void> {
		return this.fetch({
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
	getPlaylist<I extends PlaylistInclude | never = never>(
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
				this.fetch({
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
	getPlaylistEntires<I extends SongInclude | never = never>(
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
				this.fetch({
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
	async cleanLibraries(): Promise<TaskResponse> {
		return this.fetch({
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
	async scanLibrary(librarySlugOrId: number | string): Promise<TaskResponse> {
		return this.fetch({
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
	async cleanLibrary(
		librarySlugOrId: number | string,
	): Promise<TaskResponse> {
		return this.fetch({
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
	scanLibraries(): Promise<TaskResponse> {
		return this.fetch<TaskResponse, []>({
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
	async refreshMetadata(
		parentResourceType: "library" | "album" | "song" | "release" | "track",
		resourceSlugOrId: number | string,
		force: boolean,
	): Promise<void> {
		return this.fetch({
			method: "POST",
			route: "/refresh",
			errorMessage: "Metadata Refresh request failed",
			otherParameters: { [parentResourceType]: resourceSlugOrId, force },
			parameters: {},
			service: Service.Scanner,
			emptyResponse: true,
		});
	}

	async createLibrary(
		libraryName: string,
		libraryPath: string,
	): Promise<Library> {
		return this.fetch({
			route: "/libraries",
			data: { name: libraryName, path: libraryPath },
			parameters: {},
			method: "POST",
			validator: Library,
		});
	}

	async updateLibrary(
		libraryId: number,
		libraryName: string,
		libraryPath: string,
	): Promise<Library> {
		return this.fetch({
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
	async deleteLibrary(librarySlugOrId: number | string): Promise<unknown> {
		return this.fetch({
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
	async updateArtistIllustration(
		artistId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return this.updateResourceIllustration(
			artistId,
			illustrationUrl,
			"artist",
		);
	}

	/**
	 * Update Release Illustration
	 */
	async updateReleaseIllustration(
		releaseId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return this.updateResourceIllustration(
			releaseId,
			illustrationUrl,
			"release",
		);
	}

	/**
	 * Update Track Illustration
	 */
	async updateTrackIllustration(
		trackId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return this.updateResourceIllustration(
			trackId,
			illustrationUrl,
			"track",
		);
	}

	/**
	 * Update Track Illustration
	 */
	async updatePlaylistIllustration(
		playlistId: number,
		illustrationUrl: string,
	): Promise<unknown> {
		return this.updateResourceIllustration(
			playlistId,
			illustrationUrl,
			"playlist",
		);
	}

	/**
	 * Update Resourse Illustration
	 */
	private async updateResourceIllustration(
		resourceId: number,
		illustrationUrl: string,
		resourceType: "artist" | "release" | "track" | "playlist",
	): Promise<unknown> {
		return this.fetch({
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
	async updateAlbum(
		albumSlugOrId: number | string,
		dto: Partial<{ type: AlbumType; masterReleaseId: number }>,
	): Promise<void> {
		return this.fetch({
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
	async updateSong(
		songSlugOrId: number | string,
		dto: Partial<{ type: SongType; masterTrackId: number }>,
	): Promise<void> {
		return this.fetch({
			route: `/songs/${songSlugOrId}`,
			errorMessage: "Update Song Failed",
			method: "PUT",
			parameters: {},
			emptyResponse: true,
			data: dto,
		});
	}

	async updateVideo(
		videoSlugOrId: number | string,
		dto: Partial<{ type: VideoType; masterTrackId: number }>,
	): Promise<void> {
		return this.fetch({
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
	getArtists<I extends ArtistInclude | never = never>(
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
				this.fetch({
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
	getAlbums<I extends AlbumInclude | never = never>(
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
				this.fetch({
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
	getReleases<I extends ReleaseInclude | never = never>(
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
				this.fetch({
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
	getSongs<I extends SongInclude | never = never>(
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
				this.fetch({
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

	getSongGroups<I extends SongInclude | never = never>(
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
				this.fetch({
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
	getVideos<I extends VideoInclude | never = never>(
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
				this.fetch({
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
	getSong<I extends SongInclude | never = never>(
		songSlugOrId: string | number,
		include?: I[],
	): Query<SongWithRelations<I>> {
		return {
			key: ["song", songSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				this.fetch({
					route: `/songs/${songSlugOrId}`,
					parameters: { include },
					validator: SongWithRelations(include ?? []),
				}),
		};
	}

	getVideo<I extends VideoInclude | never = never>(
		videoSlugOrId: string | number,
		include?: I[],
	): Query<VideoWithRelations<I>> {
		return {
			key: ["video", videoSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				this.fetch({
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
	getSongMasterTrack<I extends TrackInclude | never = never>(
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
				this.fetch({
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
	getTrack<I extends TrackInclude | never = never>(
		trackId: string | number,
		include?: I[],
	): Query<TrackWithRelations<I>> {
		return {
			key: ["track", trackId, ...API.formatIncludeKeys(include)],
			exec: () =>
				this.fetch({
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
	getSourceFile(sourceFileId: string | number): Query<File> {
		return {
			key: ["file", sourceFileId],
			exec: () =>
				this.fetch({
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
	getAlbum<I extends AlbumInclude | never = never>(
		albumSlugOrId: string | number,
		include?: I[],
	): Query<AlbumWithRelations<I>> {
		return {
			key: ["album", albumSlugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				this.fetch({
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
	searchAll(query: string): Query<SearchResult[]> {
		return {
			key: ["search", query],
			exec: () =>
				this.fetch({
					route: "/search",
					errorMessage: "Search failed",
					parameters: {},
					otherParameters: { query },
					customValidator: SearchResultTransformer,
				}),
		};
	}

	getSearchHistory(): Query<SearchResult[]> {
		return {
			key: ["search-history-items"],
			exec: () =>
				this.fetch({
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
	saveSearchHistoryEntry(resource: SaveSearchItem): Promise<void> {
		return this.fetch({
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
	getCurrentUserStatus(): Query<User> {
		const accessToken = store.get(accessTokenAtom);

		return {
			key: ["user", accessToken ?? ""],
			exec: () =>
				this.fetch({
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
	getUsers(
		sort?: SortingParameters<typeof UserSortingKeys>,
	): InfiniteQuery<User> {
		return {
			key: ["users", ...API.formatObject(sort)],
			exec: (pagination) =>
				this.fetch({
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
	async updateUser(
		userId: number,
		updatedFields: Partial<Pick<User, "admin" | "enabled">>,
	): Promise<User> {
		return this.fetch({
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
	async deleteUser(userId: number): Promise<User> {
		return this.fetch({
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
	getMasterRelease<I extends ReleaseInclude | never = never>(
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
				this.fetch({
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
	getTracks<I extends TrackInclude | never = never>(
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
				this.fetch({
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
	getRelease<I extends ReleaseInclude | never = never>(
		slugOrId: string | number,
		include?: I[],
	): Query<ReleaseWithRelations<I>> {
		return {
			key: ["release", slugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				this.fetch({
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
	getReleaseTracklist<I extends SongInclude | never = never>(
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
				this.fetch({
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
	getSongLyrics(slugOrId: string | number): Query<Lyrics | null> {
		return {
			key: ["song", slugOrId, "lyrics"],
			exec: () =>
				this.fetch({
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
	getArtist<I extends ArtistInclude | never = never>(
		slugOrId: string | number,
		include: I[] = [],
	): Query<ArtistWithRelations<I>> {
		return {
			key: ["artist", slugOrId, ...API.formatIncludeKeys(include)],
			exec: () =>
				this.fetch({
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
	getGenres(
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
				this.fetch({
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
	getGenre(idOrSlug: string | number): Query<Genre> {
		return {
			key: ["genre", idOrSlug],
			exec: () =>
				this.fetch({
					route: `/genres/${idOrSlug}`,
					errorMessage: "Genre not found",
					parameters: {},
					validator: Genre,
				}),
		};
	}

	getArtistExternalMetadata(
		slugOrId: string | number,
	): Query<ArtistExternalMetadata | null> {
		return this.getResourceExternalMetadata(
			slugOrId,
			"artist",
			ArtistExternalMetadata,
		);
	}

	getSongExternalMetadata(
		slugOrId: string | number,
	): Query<SongExternalMetadata | null> {
		return this.getResourceExternalMetadata(
			slugOrId,
			"song",
			SongExternalMetadata,
		);
	}
	getAlbumExternalMetadata(
		slugOrId: string | number,
	): Query<AlbumExternalMetadata | null> {
		return this.getResourceExternalMetadata(
			slugOrId,
			"album",
			AlbumExternalMetadata,
		);
	}

	getResourceExternalMetadata<T, V extends yup.Schema<T>>(
		resourceSlugOrId: string | number,
		resourceType: "artist" | "album" | "song",
		validator: V,
	): Query<T | null> {
		return {
			key: [resourceType, resourceSlugOrId, "external-metadata"],
			exec: () =>
				this.fetch({
					route: `/external-metadata?${resourceType}=${resourceSlugOrId}`,
					errorMessage: "Metadata could not be loaded",
					parameters: {},
					validator: validator,
				}).catch(() => null),
		};
	}

	async fetch<ReturnType, Keys extends readonly string[]>({
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
		const header = {
			"Content-Type": "application/json",
		};

		const response = await fetch(
			this.buildURL(route, parameters, otherParameters, service),
			{
				method: method ?? "GET",
				body: data ? JSON.stringify(data) : undefined,
				headers: this.accessToken
					? {
							...header,
							Authorization: `Bearer ${this.accessToken}`,
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
	getIllustrationURL(imageURL: string): string {
		if (this.isDev) {
			return `${"/api"}${imageURL}`;
		}
		return `${this.urls.api.csr ?? "/api"}${imageURL}`;
	}

	getDirectStreamURL(fileId: number): string {
		return this.buildURL(`/stream/${fileId}/direct`, {});
	}
	getTranscodeStreamURL(fileId: number, type: TrackType): string {
		if (type === "Video") {
			return this.buildURL(`/stream/${fileId}/master.m3u8`, {});
		}
		return this.buildURL(`/stream/${fileId}/audio/0/index.m3u8`, {});
	}

	/**
	 * Builds the URL to get an archive of a given release
	 * @param releaseId slug or id of the release
	 * @returns the correct, rerouted URL
	 */
	getReleaseArchiveURL(releaseId: number | string): string {
		return this.buildURL(`/releases/${releaseId}/archive`, {});
	}

	/**
	 * Add song to playlist
	 * @returns Empty Promise
	 */
	async addSongToPlaylist(
		songId: number,
		playlistId: number,
	): Promise<unknown> {
		return this.fetch({
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
	async deletePlaylistEntry(entryId: number): Promise<unknown> {
		return this.fetch({
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
	async deletePlaylist(playlistSlugOrId: number | string): Promise<unknown> {
		return this.fetch({
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
	async setSongAsPlayed(songSlugOrId: string | number): Promise<unknown> {
		return this.fetch({
			route: `/songs/${songSlugOrId}/played`,
			errorMessage: "Song update failed",
			parameters: {},
			method: "PUT",
			validator: yup.mixed(),
		});
	}

	private buildURL(
		route: string,
		parameters: QueryParameters<any>,
		otherParameters?: any,
		service: Service = Service.API,
	): string {
		const apiHost = isSSR() ? this.urls.api.ssr : this.urls.api.csr;
		const scannerHost = isSSR()
			? this.urls.scanner.ssr
			: this.urls.scanner.csr;
		const host = service === Service.API ? apiHost : scannerHost;

		return `${host}${route}${this.formatQueryParameters(parameters, otherParameters)}`;
	}

	private formatQueryParameters<Keys extends string[]>(
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
				this.formatPagination(parameters.pagination),
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

	private formatPagination(pagination: PaginationParameters): string {
		const formattedParameters: string[] = [];
		const pageSize = pagination.pageSize ?? this.pageSize;
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
