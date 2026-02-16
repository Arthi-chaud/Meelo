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

import type { RequireExactlyOne } from "type-fest";
import * as yup from "yup";
import type { InfiniteQuery, Query } from "@/api/query";
import {
	type AlbumInclude,
	type AlbumSortingKeys,
	type AlbumType,
	AlbumWithRelations,
} from "@/models/album";
import {
	type ArtistInclude,
	type ArtistSortingKeys,
	ArtistWithRelations,
} from "@/models/artist";
import {
	AlbumExternalMetadata,
	ArtistExternalMetadata,
	type CommonExternalMetadata,
	ExternalProvider,
	SongExternalMetadata,
} from "@/models/external-metadata";
import File from "@/models/file";
import Genre, { type GenreSortingKeys } from "@/models/genre";
import Illustration from "@/models/illustration";
import Label, { type LabelSortingKeys } from "@/models/label";
import Library from "@/models/library";
import type { MatchableResourceType } from "@/models/matcher";
import PaginatedResponse, {
	type PaginationParameters,
} from "@/models/pagination";
import {
	PlaylistEntryWithRelations,
	type PlaylistInclude,
	type PlaylistSortingKeys,
	PlaylistWithRelations,
} from "@/models/playlist";
import {
	type ReleaseInclude,
	type ReleaseSortingKeys,
	ReleaseStats,
	ReleaseWithRelations,
} from "@/models/release";
import { ScrobblersStatus } from "@/models/scrobblers";
import { type SearchResult, SearchResultTransformer } from "@/models/search";
import { Settings } from "@/models/settings";
import {
	type SongInclude,
	type SongSortingKeys,
	type SongType,
	SongWithRelations,
} from "@/models/song";
import {
	type SongGroupSortingKeys,
	SongGroupWithRelations,
} from "@/models/song-group";
import type { SortingParameters } from "@/models/sorting";
import {
	type TrackInclude,
	type TrackSortingKeys,
	TrackWithRelations,
} from "@/models/track";
import { TracklistItemWithRelations } from "@/models/tracklist";
import User, { type UserSortingKeys } from "@/models/user";
import {
	type VideoInclude,
	type VideoSortingKeys,
	type VideoType,
	VideoWithRelations,
} from "@/models/video";
import type API from ".";
import { Service } from ".";

type Identifier = number | string;

export const getIllustration = (
	illustrationId: number,
): Query<Illustration> => {
	return _mkSimpleQuery({
		route: `/illustrations/${illustrationId}/info`,
		validator: Illustration,
	});
};

/// Artists

export const getArtists = <I extends ArtistInclude | never = never>(
	filter: {
		library?: Identifier[];
		album?: Identifier;
		genre?: Identifier;
		query?: Identifier;
		label?: Identifier;
	},
	sort?: SortingParameters<typeof ArtistSortingKeys>,
	include: I[] = [],
): InfiniteQuery<ArtistWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/artists",
		filter: {
			primaryArtistsOnly: filter.album ? undefined : "true",
			...filter,
			library: formatOr(filter.library),
		},
		sort,
		include,
		validator: PaginatedResponse(ArtistWithRelations(include ?? [])),
	});
};

export const getArtist = <I extends ArtistInclude | never = never>(
	slugOrId: string | number,
	include: I[] = [],
): Query<ArtistWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/artists/${slugOrId}`,
		include,
		validator: ArtistWithRelations(include ?? []),
	});
};

/// Albums

export const getAlbum = <I extends AlbumInclude | never = never>(
	albumSlugOrId: string | number,
	include?: I[],
): Query<AlbumWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/albums/${albumSlugOrId}`,
		include,
		validator: AlbumWithRelations(include ?? []),
	});
};

export const getAlbums = <I extends AlbumInclude | never = never>(
	filter: {
		library?: Identifier[];
		artist?: Identifier;
		genre?: Identifier;
		type?: AlbumType[];
		related?: Identifier;
		appearance?: Identifier;
		query?: Identifier;
		label?: Identifier;
		random?: number;
	},
	sort?: SortingParameters<typeof AlbumSortingKeys>,
	include?: I[],
): InfiniteQuery<AlbumWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/albums",
		include,
		sort,
		filter: {
			...filter,
			library: formatOr(filter.library),
			type: formatOr(filter.type),
		},
		validator: PaginatedResponse(AlbumWithRelations(include ?? [])),
	});
};

/// Songs

export const getSongs = <I extends SongInclude | never = never>(
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
): InfiniteQuery<SongWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/songs",
		filter: {
			...filter,
			library: formatOr(filter.library),
			type: formatOr(filter.type),
		},
		sort,
		include,
		validator: PaginatedResponse(SongWithRelations(include ?? [])),
	});
};

export const getSong = <I extends SongInclude | never = never>(
	songSlugOrId: string | number,
	include?: I[],
): Query<SongWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/songs/${songSlugOrId}`,
		include,
		validator: SongWithRelations(include ?? []),
	});
};

export const getSongGroups = <I extends SongInclude | never = never>(
	filter: {
		library?: Identifier[];
		genre?: Identifier;
		artist?: Identifier;
		query?: string;
		type?: SongType;
	},
	sort?: SortingParameters<typeof SongGroupSortingKeys>,
	include?: I[],
): InfiniteQuery<SongGroupWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/song-groups",
		include,
		sort,
		filter: { ...filter, library: formatOr(filter.library) },
		validator: PaginatedResponse(SongGroupWithRelations(include ?? [])),
	});
};

/// Videos
export const getVideos = <I extends VideoInclude | never = never>(
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
): InfiniteQuery<VideoWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/videos",
		include,
		sort,
		filter: {
			...filter,
			library: formatOr(filter.library),
			type: formatOr(filter.type),
		},
		validator: PaginatedResponse(VideoWithRelations(include ?? [])),
	});
};

export const getVideo = <I extends VideoInclude | never = never>(
	videoSlugOrId: string | number,
	include?: I[],
): Query<VideoWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/videos/${videoSlugOrId}`,
		include,
		validator: VideoWithRelations(include ?? []),
	});
};

/// Releases

export const getReleases = <I extends ReleaseInclude | never = never>(
	filter: { album?: Identifier },
	sort?: SortingParameters<typeof ReleaseSortingKeys>,
	include?: I[],
): InfiniteQuery<ReleaseWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/releases",
		filter,
		sort,
		include,
		validator: PaginatedResponse(ReleaseWithRelations(include ?? [])),
	});
};

export const getMasterRelease = <I extends ReleaseInclude | never = never>(
	albumSlugOrId: string | number,
	include?: I[],
): Query<ReleaseWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/releases/master/${albumSlugOrId}`,
		include,
		validator: ReleaseWithRelations(include ?? []),
	});
};

export const getRelease = <I extends ReleaseInclude | never = never>(
	slugOrId: string | number,
	include?: I[],
): Query<ReleaseWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/releases/${slugOrId}`,
		include,
		validator: ReleaseWithRelations(include ?? []),
	});
};

/// Tracks

export const getTrack = <I extends TrackInclude | never = never>(
	trackId: string | number,
	include?: I[],
): Query<TrackWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/tracks/${trackId}`,
		include,
		validator: TrackWithRelations(include ?? []),
	});
};

export const getTracks = <I extends TrackInclude | never = never>(
	filter: { song?: string | number; library?: Identifier[] },
	sort?: SortingParameters<typeof TrackSortingKeys>,
	include?: I[],
): InfiniteQuery<TrackWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/tracks",
		include,
		sort,
		filter: { ...filter, library: formatOr(filter.library) },
		validator: PaginatedResponse(TrackWithRelations(include ?? [])),
	});
};

export const getReleaseTracklist = <I extends SongInclude | never = never>(
	slugOrId: string | number,
	exclusiveOnly = false,
	include?: I[],
): InfiniteQuery<TracklistItemWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: `/releases/${slugOrId.toString()}/tracklist`,
		include,
		filter: { exclusive: exclusiveOnly ? "true" : undefined },
		validator: PaginatedResponse(TracklistItemWithRelations(include ?? [])),
	});
};

export const getReleaseStats = (
	slugOrId: string | number,
): Query<ReleaseStats> => {
	return _mkSimplePaginatedQuery({
		route: `/releases/${slugOrId.toString()}/stats`,
		validator: ReleaseStats,
	});
};

export const getSongMasterTrack = <I extends TrackInclude | never = never>(
	songSlugOrId: string | number,
	include?: I[],
): Query<TrackWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/tracks/master/song/${songSlugOrId}`,
		include,
		validator: TrackWithRelations(include ?? []),
	});
};

/// Libraries

export const getLibraries = (): InfiniteQuery<Library> => {
	return _mkSimplePaginatedQuery({
		route: "/libraries",
		validator: PaginatedResponse(Library),
	});
};

/// Playlists

export const getPlaylists = <I extends PlaylistInclude | never = never>(
	filter: { album?: Identifier; changeable?: true },
	sort?: SortingParameters<typeof PlaylistSortingKeys>,
	include?: I[],
): InfiniteQuery<PlaylistWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: "/playlists",
		sort,
		include,
		filter: {
			...filter,
			changeable: filter.changeable ? "true" : undefined,
		},
		validator: PaginatedResponse(PlaylistWithRelations(include ?? [])),
	});
};

export const getPlaylist = <I extends PlaylistInclude | never = never>(
	playlistSlugOrId: string | number,
	include?: I[],
): Query<PlaylistWithRelations<I>> => {
	return _mkSimpleQuery({
		route: `/playlists/${playlistSlugOrId}`,
		include,
		validator: PlaylistWithRelations(include ?? []),
	});
};

export const getPlaylistEntries = <I extends SongInclude | never = never>(
	playlistSlugOrId: string | number,
	include?: I[],
): InfiniteQuery<PlaylistEntryWithRelations<I>> => {
	return _mkSimplePaginatedQuery({
		route: `/playlists/${playlistSlugOrId}/entries`,
		include,
		validator: PaginatedResponse(PlaylistEntryWithRelations(include ?? [])),
	});
};

/// Genres

export const getGenres = (
	filter: { artist?: Identifier; album?: Identifier; song?: Identifier },
	sort?: SortingParameters<typeof GenreSortingKeys>,
): InfiniteQuery<Genre> => {
	return _mkSimplePaginatedQuery({
		route: "/genres",
		sort,
		filter,
		validator: PaginatedResponse(Genre),
	});
};

export const getGenre = (idOrSlug: string | number): Query<Genre> => {
	return _mkSimpleQuery({
		route: `/genres/${idOrSlug}`,
		validator: Genre,
	});
};

/// Labels
export const getLabel = (identifier: string | number): Query<Label> => {
	return _mkSimpleQuery({
		route: `/labels/${identifier}`,
		validator: Label,
	});
};

export const getLabels = (
	filter: { artist?: Identifier; album?: Identifier },
	sort?: SortingParameters<typeof LabelSortingKeys>,
): InfiniteQuery<Label> => {
	return _mkSimplePaginatedQuery({
		route: "/labels",
		filter,
		sort,
		validator: PaginatedResponse(Label),
	});
};

/// External Metadata

export const getArtistExternalMetadata = (slugOrId: string | number) =>
	getResourceExternalMetadata<ArtistExternalMetadata>(
		slugOrId,
		"artist",
		ArtistExternalMetadata,
	);

export const getSongExternalMetadata = (slugOrId: string | number) =>
	getResourceExternalMetadata<SongExternalMetadata>(
		slugOrId,
		"song",
		SongExternalMetadata,
	);

export const getAlbumExternalMetadata = (slugOrId: string | number) =>
	getResourceExternalMetadata<AlbumExternalMetadata>(
		slugOrId,
		"album",
		AlbumExternalMetadata,
	);

export const getResourceExternalMetadata = <
	T extends CommonExternalMetadata,
	V extends yup.Schema<T> = yup.Schema<T>,
>(
	resourceSlugOrId: string | number,
	resourceType: MatchableResourceType,
	validator: V,
): Query<T | null> => {
	const query = _mkSimpleQuery({
		route: "/external-metadata",
		params: { [resourceType]: resourceSlugOrId },
		validator,
	});
	return {
		...query,
		exec: (api) => () =>
			query
				.exec(api)()
				.catch(() => null),
	};
};

/// File

export const getSourceFile = (sourceFileId: string | number): Query<File> => {
	return _mkSimpleQuery({
		route: `/files/${sourceFileId}`,
		validator: File,
	});
};

/// Search

export const searchAll = (query: string): Query<SearchResult[]> => {
	return _mkSimpleQuery({
		route: "/search",
		params: { query },
		customValidator: SearchResultTransformer,
	});
};

export const getSearchHistory = (): Query<SearchResult[]> => {
	return _mkSimpleQuery({
		route: "/search/history",
		customValidator: SearchResultTransformer,
	});
};

export const getExternalProviders = (): InfiniteQuery<ExternalProvider> => {
	return _mkSimplePaginatedQuery({
		route: "/external-providers",
		validator: PaginatedResponse(ExternalProvider),
	});
};

/// Users

export const getCurrentUserStatus = (): Query<User> => {
	return _mkSimpleQuery({
		route: "/users/me",
		validator: User,
	});
};

export const getUsers = (
	sort?: SortingParameters<typeof UserSortingKeys>,
): InfiniteQuery<User> => {
	return _mkSimplePaginatedQuery({
		route: "/users",
		sort,
		validator: PaginatedResponse(User),
	});
};

/// Tasks

export const getTasks = () => {
	return _mkSimpleQuery({
		route: "/tasks",
		validator: yup.object({
			current_task: yup.string().required().nullable(),
			progress: yup.number().required().nullable(),
			pending_tasks: yup.array(yup.string().required()).required(),
		}),
		service: Service.Scanner,
	});
};

/// Scrobblers

export const getScrobblerStatus = (): Query<ScrobblersStatus> => {
	return _mkSimpleQuery({
		route: "/scrobblers",
		validator: ScrobblersStatus,
	});
};

/// Settings
export const getSettings = (): Query<Settings> => {
	return _mkSimpleQuery({ route: "/settings", validator: Settings });
};

export const getScannerVersion = () => {
	return _mkSimpleQuery({
		route: "/",
		validator: yup.object({
			version: yup.string().required(),
		}),
		service: Service.Scanner,
	});
};

export const getMatcherVersion = (): Query<{ version: string | null }> => {
	const query = _mkSimpleQuery({
		route: "/",
		validator: yup.object({
			version: yup.string().required(),
		}),
		service: Service.Matcher,
	});
	return {
		...query,
		exec: (api: API) => () =>
			query
				.exec(api)()
				.catch(() => ({ version: null })),
	};
};

export const getMatcherStatus = () => {
	const query = _mkSimpleQuery({
		route: "/queue",
		validator: yup.object({
			handled_items: yup.number().required(),
			pending_items: yup.number().required(),
			current_item: yup
				.object({
					id: yup.number().required(),
					name: yup.string().required(),
					type: yup.string().required(),
				})
				.required()
				.nullable(),
		}),
		service: Service.Matcher,
	});
	return {
		...query,
		exec: (api: API) => () =>
			query
				.exec(api)()
				.catch(() => null),
	};
};

export const _mkSimpleQuery = <T>(
	arg: {
		route: string;
		include?: string[];
		params?: Record<string, string | number>;
		service?: Service;
		errorMessage?: string;
	} & RequireExactlyOne<{
		emptyResponse: true;
		validator: yup.Schema<T>;
		customValidator: (value: unknown) => Promise<T>;
	}>,
) => {
	const key = [
		(arg.service ?? Service.API).toString(),
		...arg.route.split("/").filter((t) => t.length > 0),
		...formatIncludeKeys(arg.include),
		...formatObject(arg.params),
	];

	return {
		key,
		exec: (api: API) => () =>
			api.fetch({
				route: arg.route,
				errorMessage: arg.errorMessage,
				parameters: { include: arg.include },
				otherParameters: arg.params,
				service: arg.service ?? Service.API,
				...(arg.validator
					? { validator: arg.validator }
					: arg.customValidator
						? { customValidator: arg.customValidator }
						: { emptyResponse: true }),
			}),
	};
};

export const _mkSimplePaginatedQuery = <T>(
	arg: {
		route: string;
		include?: string[];
		filter?: Record<
			string,
			undefined | string | number | (string | number)[]
		>;
		sort?: SortingParameters<any>;
		service?: Service;
		errorMessage?: string;
	} & RequireExactlyOne<{
		emptyResponse: true;
		validator: yup.Schema<T>;
		customValidator: (value: unknown) => Promise<T>;
	}>,
) => {
	const key = [
		...arg.route.split("/").filter((t) => t.length > 0),
		...formatIncludeKeys(arg.include),
		...formatObject(arg.sort),
		...formatObject(arg.filter),
	];

	return {
		key,
		exec: (api: API) => (pagination?: PaginationParameters) => {
			if (pagination === undefined) {
				pagination = { pageSize: api.pageSize };
			}
			return api.fetch({
				route: arg.route,
				errorMessage: arg.errorMessage,
				parameters: {
					include: arg.include,
					pagination,
					sort: arg.sort,
				},
				otherParameters: arg.filter,
				service: arg.service ?? Service.API,
				...(arg.validator
					? { validator: arg.validator }
					: arg.customValidator
						? { customValidator: arg.customValidator }
						: { emptyResponse: true }),
			});
		},
	};
};

// Format Includes for the query key
const formatIncludeKeys = (includes?: string[]) =>
	includes?.map((include) => `include-${include}`) ?? [];

// format any object for the query key
const formatObject = (includes?: object) =>
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

const formatOr = (
	items: (string | number)[] | undefined,
): string | undefined => {
	if (!items || items.length === 0) {
		return undefined;
	}
	if (items.length === 1) {
		return items[0].toString();
	}
	return `or:${items.map((i) => i.toString()).join(",")}`;
};
