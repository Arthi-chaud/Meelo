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
import type { AlbumType } from "@/models/album";
import { ResourceNotFound } from "@/models/exceptions";
import type { IllustrationQuality } from "@/models/illustration";
import Library from "@/models/library";
import type { PaginationParameters } from "@/models/pagination";
import Playlist, {
	type CreatePlaylistDto,
	type UpdatePlaylistDto,
} from "@/models/playlist";
import type { Scrobbler } from "@/models/scrobblers";
import type { SaveSearchItem } from "@/models/search";
import type { SongType } from "@/models/song";
import type { SortingParameters } from "@/models/sorting";
import { TaskResponse } from "@/models/task";
import type { TrackType } from "@/models/track";
import User from "@/models/user";
import type { VideoType } from "@/models/video";

const AuthenticationResponse = yup.object({
	access_token: yup.string().required(),
});

type AuthenticationResponse = yup.InferType<typeof AuthenticationResponse>;

type AddToPlaylistPayload = RequireExactlyOne<
	Record<"songId" | "releaseId" | "artistId" | "playlistId", number>
>;

type QueryParameters<Keys extends readonly string[]> = {
	pagination?: PaginationParameters | null;
	include?: string[];
	sort?: SortingParameters<Keys>;
};

type AuthenticationInput = {
	username: string;
	password: string;
};

export enum Service {
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
	api: string;
	scanner: string;
	illustration: string;
};

export default class API {
	constructor(
		public readonly accessToken: string | null,
		public readonly urls: APIUrls,
		public readonly pageSize = API.DefaultPageSize,
	) {}
	public static readonly DefaultPageSize = 35;

	///// Auth + User management

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

	async changePassword(
		credentials: Record<"newPassword" | "oldPassword", string>,
	): Promise<void> {
		return this.fetch({
			route: "/users/me/password",
			data: credentials,
			parameters: {},
			method: "POST",
			// To force JSON deserialisation and have the error message
			customValidator: async (_v: unknown) => {},
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

	//// Tasks

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

	async scanLibraries(): Promise<TaskResponse> {
		return this.fetch<TaskResponse, []>({
			route: "/scan",
			parameters: {},
			service: Service.Scanner,
			method: "POST",
			validator: TaskResponse,
		});
	}

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

	//// Playlists

	async createPlaylist(dto: CreatePlaylistDto): Promise<Playlist> {
		return this.fetch({
			route: "/playlists",
			data: dto,
			errorMessage: "Playlist Creation Failed",
			parameters: {},
			method: "POST",
			validator: Playlist,
		});
	}

	async updatePlaylist(
		playlistSlugOrId: number | string,
		dto: UpdatePlaylistDto,
	): Promise<Playlist> {
		return this.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			data: dto,
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

	async addToPlaylist(
		playload: AddToPlaylistPayload,
		playlistId: number,
	): Promise<unknown> {
		return this.fetch({
			route: `/playlists/${playlistId}/entries`,
			errorMessage: "Failed to add to playlist",
			parameters: {},
			data: playload,
			method: "POST",
			emptyResponse: true,
		});
	}

	async deletePlaylistEntry(entryId: number): Promise<unknown> {
		return this.fetch({
			route: `/playlists/entries/${entryId}`,
			errorMessage: "Failed to remove song from playlist",
			parameters: {},
			method: "DELETE",
			emptyResponse: true,
		});
	}

	async deletePlaylist(playlistSlugOrId: number | string): Promise<unknown> {
		return this.fetch({
			route: `/playlists/${playlistSlugOrId}`,
			errorMessage: "Failed to remove playlist",
			parameters: {},
			method: "DELETE",
			emptyResponse: true,
		});
	}

	//// Libraries

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

	async deleteLibrary(librarySlugOrId: number | string): Promise<unknown> {
		return this.fetch({
			route: `/libraries/${librarySlugOrId}`,
			errorMessage: "Library deletion failed",
			parameters: {},
			method: "DELETE",
			validator: yup.mixed(),
		});
	}

	///// Illustrations

	async updateArtistIllustration(artistId: number, illustrationUrl: string) {
		return this.updateResourceIllustration(
			artistId,
			illustrationUrl,
			"artist",
		);
	}

	async updateReleaseIllustration(
		releaseId: number,
		illustrationUrl: string,
	) {
		return this.updateResourceIllustration(
			releaseId,
			illustrationUrl,
			"release",
		);
	}

	async updateTrackIllustration(trackId: number, illustrationUrl: string) {
		return this.updateResourceIllustration(
			trackId,
			illustrationUrl,
			"track",
		);
	}

	async updatePlaylistIllustration(
		playlistId: number,
		illustrationUrl: string,
	) {
		return this.updateResourceIllustration(
			playlistId,
			illustrationUrl,
			"playlist",
		);
	}

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

	/// Albums

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

	//// Songs

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

	async setSongAsPlayed(songSlugOrId: string | number): Promise<unknown> {
		return this.fetch({
			route: `/songs/${songSlugOrId}/played`,
			errorMessage: "Song update failed",
			parameters: {},
			method: "PUT",
			validator: yup.mixed(),
		});
	}

	async mergeSongs(srcSongId: number, destSongId: number): Promise<void> {
		return this.fetch({
			route: `/songs/${srcSongId}/merge`,
			data: { songId: destSongId },
			parameters: {},
			method: "POST",
			emptyResponse: true,
		});
	}

	//// tracks
	async updateTrack(trackId: number, destSongId: number): Promise<void> {
		return this.fetch({
			route: `/tracks/${trackId}`,
			data: { songId: destSongId },
			parameters: {},
			method: "PUT",
			emptyResponse: true,
		});
	}

	//// videos

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

	//// search

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

	/// LastFM

	getLastFMAuthUrl(origin: string) {
		return this.fetch({
			route: "/scrobblers/lastfm/url",
			parameters: {},
			otherParameters: {
				callback: `${origin}/scrobblers/lastfm/callback_handler`, //redirecting to the settings page
			},
			validator: yup.object({ url: yup.string().required() }),
		});
	}

	async postLastFMToken(token: string) {
		return this.fetch({
			method: "POST",
			route: "/scrobblers/lastfm",
			data: { token },
			parameters: {},
			emptyResponse: true,
		});
	}

	/// ListenBrainz

	async postListenBrainzToken(token: string, instanceUrl: string | null) {
		return this.fetch({
			method: "POST",
			route: "/scrobblers/listenbrainz",
			data: { token, instanceUrl },
			parameters: {},
			emptyResponse: true,
		});
	}

	async disconnectScrobbler(scrobbler: Scrobbler) {
		let route = "/scrobblers";
		switch (scrobbler) {
			case "LastFM":
				route = `${route}/lastfm`;
				break;
			case "ListenBrainz":
				route = `${route}/listenbrainz`;
				break;
		}
		return this.fetch({
			method: "DELETE",
			route,
			parameters: {},
			emptyResponse: true,
		});
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
					errorMessage ??
						jsonResponse?.message ??
						"Unauthorized: Only for admins",
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

	/// URL builders

	/**
	 * Builds the URL to fetch an illustration, from the browser/client pov
	 * @param imageURL
	 * @returns the correct, rerouted URL
	 */
	getIllustrationURL(imageURL: string, quality: IllustrationQuality): string {
		const url = `${this.urls.illustration}${imageURL}`;
		const qualityQuery =
			quality === "original"
				? ""
				: `${url.includes("?") ? "&" : "?"}quality=${quality}`;
		return `${url}${qualityQuery}`;
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

	private buildURL(
		route: string,
		parameters: QueryParameters<any>,
		otherParameters?: any,
		service: Service = Service.API,
	): string {
		const apiHost = this.urls.api;
		const scannerHost = this.urls.scanner;
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
		if (
			parameters.pagination !== undefined &&
			parameters.pagination !== null
		) {
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

		if (pagination.afterId !== undefined) {
			formattedParameters.push(`afterId=${pagination.afterId}`);
		}
		formattedParameters.push(
			`take=${pagination.pageSize ?? this.pageSize}`,
		);
		return formattedParameters.join("&");
	}
}
