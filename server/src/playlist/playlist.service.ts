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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Playlist, Prisma } from "src/prisma/generated/client";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import IllustrationRepository from "src/illustration/illustration.repository";
import Logger from "src/logger/logger";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import TrackService from "src/track/track.service";
import type PlaylistQueryParameters from "./models/playlist.query-parameters";
import type { PlaylistEntryModel } from "./models/playlist-entry.model";
import {
	AddItemToPlaylistFailureException,
	PlaylistAlreadyExistsException,
	PlaylistEntryNotFoundException,
	PlaylistNotFoundException,
	PlaylistReorderInvalidArrayException,
	UnallowedPlaylistUpdate,
} from "./playlist.exceptions";

@Injectable()
export default class PlaylistService {
	private readonly logger = new Logger(PlaylistService.name);
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		private prismaService: PrismaService,
	) {}

	async create(input: PlaylistQueryParameters.CreateInput) {
		try {
			return await this.prismaService.playlist.create({
				data: {
					name: input.name,
					allowChanges: input.allowChanges,
					isPublic: input.isPublic,
					ownerId: input.ownerId,
					slug: new Slug(`${input.name}-${input.ownerId}`).toString(),
				},
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === PrismaError.UniqueConstraintViolation) {
					throw new PlaylistAlreadyExistsException(input.name);
				}
			}
			throw new UnhandledORMErrorException(error, input);
		}
	}

	async get<I extends PlaylistQueryParameters.RelationInclude = {}>(
		where: PlaylistQueryParameters.WhereInput,
		// ID of the user making the request
		userId: number | null,
		include?: I,
	) {
		const args = {
			where: {
				AND: [
					PlaylistService.formatWhereInput(where),
					this._queryUserCanSeePlaylist(userId),
				],
			},
			include: include ?? ({} as I),
		};
		return this.prismaService.playlist
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.PlaylistFindFirstOrThrowArgs
				>
			>(args)
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	async getEntries<I extends SongQueryParameters.RelationInclude = {}>(
		where: PlaylistQueryParameters.WhereInput,
		userId: number | null,
		pagination?: PaginationParameters,
		include?: I,
	): Promise<PlaylistEntryModel[]> {
		const playlist = await this.get(where, userId); // Check if user is allowed to see playlist
		const args = {
			where: { playlistId: playlist.id },
			orderBy: {
				index: "asc" as const,
			},
			include: {
				song: {
					include: include ?? ({} as I),
				},
			},
			...formatPaginationParameters(pagination),
		};
		return this.prismaService.playlistEntry
			.findMany<
				Prisma.SelectSubset<
					typeof args,
					Prisma.PlaylistEntryFindManyArgs
				>
			>(args)
			.catch((error) => {
				throw this.onNotFound(error, where);
			})
			.then((entries) =>
				entries.map(({ id, index, song }) => ({
					entryId: id,
					index,
					...song,
				})),
			);
	}

	async getMany<I extends PlaylistQueryParameters.RelationInclude = {}>(
		where: PlaylistQueryParameters.ManyWhereInput,
		// ID of the user making the request
		userId: number | null,
		sort?: PlaylistQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
		include?: I,
	) {
		const args = {
			where: {
				AND: [
					PlaylistService.formatManyWhereInput(where),
					this._queryUserCanSeePlaylist(userId),
				],
			},
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			...formatPaginationParameters(pagination),
			include: include ?? ({} as I),
		};
		return this.prismaService.playlist.findMany<
			Prisma.SelectSubset<typeof args, Prisma.PlaylistFindManyArgs>
		>(args);
	}

	onNotFound(
		error: Error,
		where: PlaylistQueryParameters.WhereInput,
	): Error | Promise<Error> {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			return new PlaylistNotFoundException(where.id ?? where.slug);
		}
		return new UnhandledORMErrorException(error, where);
	}

	static formatWhereInput(input: PlaylistQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
		};
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	static formatManyWhereInput(
		input: PlaylistQueryParameters.ManyWhereInput,
	): Prisma.PlaylistWhereInput {
		const query: Prisma.PlaylistWhereInput[] = [
			{
				id: input.id,
				entries: input.song
					? {
							some: {
								song: SongService.formatWhereInput(input.song),
							},
						}
					: input.album
						? {
								some: {
									song: {
										tracks: {
											some: {
												release: {
													album: AlbumService.formatWhereInput(
														input.album,
													),
												},
											},
										},
									},
								},
							}
						: undefined,
				ownerId: input.owner?.id,
			},
		];

		if (input.changleableBy) {
			query.push({
				OR: [
					{ ownerId: input.changleableBy.id },
					{ isPublic: true, allowChanges: true },
				],
			});
		}
		return { AND: query };
	}

	formatSortingInput(
		sortingParameter: PlaylistQueryParameters.SortingParameter,
	): Prisma.PlaylistOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ slug: sortingParameter.order }];
			case "creationDate":
				return [
					{ createdAt: sortingParameter.order },
					{ id: sortingParameter.order },
				];
			case "entryCount":
				return [
					{ entries: { _count: sortingParameter.order } },
					{ slug: "asc" },
					{ id: "asc" },
				];
			default:
				return [
					{
						[sortingParameter.sortBy ?? "id"]:
							sortingParameter.order,
					},
				];
		}
	}

	// Only playlist owner can update the playlist
	async update(
		what: PlaylistQueryParameters.UpdateInput,
		where: PlaylistQueryParameters.WhereInput,
		userId: number,
	) {
		const playlist = await this.get(where, userId);
		if (playlist.ownerId !== userId) {
			throw new UnallowedPlaylistUpdate(playlist.id);
		}
		return this.prismaService.playlist
			.update({
				data: {
					name: what.name,
					slug: what.name
						? new Slug(
								`${what.name}-${playlist.ownerId}`,
							).toString()
						: undefined,
					allowChanges: what.allowChanges,
					isPublic: what.isPublic,
				},
				where: { id: playlist.id },
			})
			.catch((error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new PlaylistAlreadyExistsException(
							what.name ?? "",
						);
					}
				}
				throw this.onNotFound(error, where);
			});
	}

	// Only playlist owner can delete the playlist
	async delete(where: PlaylistQueryParameters.DeleteInput, userId: number) {
		const playlist = await this.get(where, userId);

		if (playlist.ownerId !== userId) {
			throw new UnallowedPlaylistUpdate(playlist.id);
		}
		return this.prismaService.playlist
			.delete({
				where: { id: playlist.id },
			})
			.then((deleted) => {
				if (deleted.illustrationId !== null) {
					this.illustrationRepository.deleteIllustration(
						deleted.illustrationId,
					);
				}
				return deleted;
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	/**
	 * Reorders a playlist using list of entry ids
	 * @param where the query parametrs to find the playlist
	 * @param entryIds the list of entry ids of the playlist
	 * The list must be complete
	 */
	async reorderPlaylist(
		where: PlaylistQueryParameters.WhereInput,
		userId: number,
		entryIds: number[],
	) {
		const playlist = await this.get(where, userId);
		this._guardCanUpdatePlaylist(playlist, userId);

		const entries = await this.prismaService.playlistEntry.findMany({
			where: {
				playlistId: playlist.id,
			},
		});
		const missingEntryIds = entries.filter(
			({ id }) => entryIds.indexOf(id) === -1,
		);
		const unknownEntryIds = entryIds.filter(
			(id) => !entries.find((entry) => entry.id === id),
		);

		if (
			entries.length !== entryIds.length ||
			unknownEntryIds.length !== 0 ||
			missingEntryIds.length !== 0
		) {
			throw new PlaylistReorderInvalidArrayException();
		}
		await this.prismaService.$transaction(
			entryIds.map((id, newIndex) =>
				this.prismaService.playlistEntry.update({
					where: { id },
					data: { index: newIndex },
				}),
			),
		);
	}

	/**
	 * Deletes a playlist entry, and flattens the playlist
	 * @param entryId the ID of the entry to delete
	 */
	async removeEntry(entryId: number, userId: number) {
		const { playlist, ...entry } = await this.prismaService.playlistEntry
			.findUniqueOrThrow({
				where: { id: entryId },
				include: { playlist: true },
			})
			.catch(() => {
				throw new PlaylistEntryNotFoundException(entryId);
			});

		this._guardCanUpdatePlaylist(playlist, userId);
		const deleted = await this.prismaService.playlistEntry
			.delete({ where: { id: entry.id } })
			.catch(() => {
				throw new PlaylistEntryNotFoundException(entryId);
			});

		await this.flatten({ id: deleted.playlistId });
	}

	async _getLastEntryIndexInPlaylist(playlistId: number) {
		return this.prismaService.playlistEntry
			.findFirst({
				where: { playlistId },
				select: { index: true },
				orderBy: { index: "desc" },
			})
			.then((entry) => entry?.index ?? null);
	}
	/**
	 * Add song at the end of a playlist
	 * @param song the query parameters to find the song
	 * @param playlist the query parameters to find the playlist
	 */
	async addSong(
		song: SongQueryParameters.WhereInput,
		userId: number,
		playlist: PlaylistQueryParameters.WhereInput,
	) {
		const [s, p] = await Promise.all([
			this.songService.get(song),
			this.get(playlist, userId),
		]);

		this._guardCanUpdatePlaylist(p, userId);
		const lastEntryIndex = await this._getLastEntryIndexInPlaylist(p.id);

		await this._addToPlaylist(
			[s.id],
			p.id,
			lastEntryIndex ? lastEntryIndex + 1 : 0,
		);
	}

	/**
	 * Add release at the end of a playlist
	 */
	async addRelease(
		release: ReleaseQueryParameters.WhereInput,
		userId: number,
		playlist: PlaylistQueryParameters.WhereInput,
	) {
		const p = await this.get(playlist, userId);

		this._guardCanUpdatePlaylist(p, userId);
		const lastEntryIndex = await this._getLastEntryIndexInPlaylist(p.id);
		const songIdsToAdd = await this.prismaService.track
			.findMany({
				where: TrackService.formatManyWhereInput({
					release: { is: release },
				}),
				select: { songId: true, video: { select: { songId: true } } },
				orderBy: [
					{ discIndex: { sort: "asc", nulls: "last" } },
					{ trackIndex: { sort: "asc", nulls: "last" } },
				],
			})
			.then((items) =>
				items
					.map((t) => t.songId ?? t.video?.songId)
					.filter(
						(id): id is number => id !== null && id !== undefined,
					),
			);

		await this._addToPlaylist(
			songIdsToAdd,
			p.id,
			lastEntryIndex ? lastEntryIndex + 1 : 0,
		);
	}

	/**
	 * Add artist's song at the end of a playlist
	 */
	async addArtist(
		artist: ArtistQueryParameters.WhereInput,
		userId: number,
		playlist: PlaylistQueryParameters.WhereInput,
	) {
		const p = await this.get(playlist, userId);

		this._guardCanUpdatePlaylist(p, userId);
		const lastEntryIndex = await this._getLastEntryIndexInPlaylist(p.id);
		const songIdsToAdd = await this.prismaService.song.findMany({
			where: SongService.formatManyWhereInput({ artist: { is: artist } }),
			select: { id: true },
			orderBy: { sortSlug: "asc" },
		});

		await this._addToPlaylist(
			songIdsToAdd.map(({ id }) => id),
			p.id,
			lastEntryIndex ? lastEntryIndex + 1 : 0,
		);
	}

	/**
	 * Add playlist at the end of a playlist
	 */
	async addPlaylist(
		sourcePlaylist: PlaylistQueryParameters.WhereInput,
		userId: number,
		destPlaylist: PlaylistQueryParameters.WhereInput,
	) {
		const [_, p] = await Promise.all([
			this.get(sourcePlaylist, userId),
			this.get(destPlaylist, userId),
		]);

		this._guardCanUpdatePlaylist(p, userId);
		const lastEntryIndex = await this._getLastEntryIndexInPlaylist(p.id);
		const songsToAdd = await this.getEntries(sourcePlaylist, userId);

		await this._addToPlaylist(
			songsToAdd.map(({ id }) => id),
			p.id,
			lastEntryIndex ? lastEntryIndex + 1 : 0,
		);
	}

	async _addToPlaylist(
		songIds: number[],
		playlistId: number,
		startIndex: number,
	) {
		try {
			await this.prismaService.playlistEntry.createMany({
				data: songIds.map((songId, index) => ({
					playlistId: playlistId,
					songId: songId,
					index: startIndex + index,
				})),
			});
		} catch (err) {
			this.logger.error(err.message);
			throw new AddItemToPlaylistFailureException();
		}
	}

	/**
	 * Apply correct indexes to playlist entries
	 * @param where the query parameters to find the playlist
	 */
	async flatten(where: PlaylistQueryParameters.WhereInput) {
		const entries = await this.prismaService.playlistEntry.findMany({
			where: { playlist: PlaylistService.formatWhereInput(where) },
			orderBy: { index: "asc" },
		});

		return this.prismaService.$transaction(
			entries.map((entry, newIndex) =>
				this.prismaService.playlistEntry.update({
					data: { index: newIndex },
					where: { id: entry.id },
				}),
			),
		);
	}

	async housekeeping() {
		// Cannot use service function, we need to bypass the visibiliy rule  (isPublic)
		const playlists = await this.prismaService.playlist.findMany({
			select: { id: true },
		});

		await Promise.all(
			playlists.map((playlist) => this.flatten({ id: playlist.id })),
		);
	}

	private _queryUserCanSeePlaylist(userId: number | null) {
		if (userId === null) {
			return { OR: [{ isPublic: true }] };
		}
		return { OR: [{ ownerId: userId }, { isPublic: true }] };
	}

	// Throws an error if the owner of the playlist disabled changes form other users
	private _guardCanUpdatePlaylist(playlist: Playlist, userId: number | null) {
		if (
			userId === null ||
			(playlist.ownerId !== userId && !playlist.allowChanges)
		) {
			throw new UnallowedPlaylistUpdate(playlist.id);
		}
	}
}
