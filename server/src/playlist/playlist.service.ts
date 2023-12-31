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

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import RepositoryService from "src/repository/repository.service";
import PlaylistQueryParameters from "./models/playlist.query-parameters";
import { Prisma } from "@prisma/client";
import Slug from "src/slug/slug";
import { PlaylistWithRelations } from "src/prisma/models";
import SongService from "src/song/song.service";
import { PrismaError } from "prisma-error-enum";
import {
	AddSongToPlaylistFailureException,
	PlaylistAlreadyExistsException,
	PlaylistEntryNotFoundException,
	PlaylistNotFoundException,
	PlaylistNotFoundFromIDException,
	PlaylistReorderInvalidArrayException,
} from "./playlist.exceptions";
import PrismaService from "src/prisma/prisma.service";
import Logger from "src/logger/logger";
import Identifier from "src/identifier/models/identifier";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
// eslint-disable-next-line no-restricted-imports
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import AlbumService from "src/album/album.service";
import SongVersionService from "src/song-version/song-version.service";
import SongVersionQueryParameters from "src/song-version/models/song-version.query-params";

@Injectable()
export default class PlaylistService extends RepositoryService<
	PlaylistWithRelations,
	PlaylistQueryParameters.CreateInput,
	PlaylistQueryParameters.WhereInput,
	PlaylistQueryParameters.ManyWhereInput,
	PlaylistQueryParameters.UpdateInput,
	PlaylistQueryParameters.DeleteInput,
	PlaylistQueryParameters.SortingKeys,
	Prisma.PlaylistCreateInput,
	Prisma.PlaylistWhereUniqueInput,
	Prisma.PlaylistWhereInput,
	Prisma.PlaylistUpdateInput,
	Prisma.PlaylistWhereUniqueInput,
	Prisma.PlaylistOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(PlaylistService.name);
	constructor(
		@Inject(forwardRef(() => SongVersionService))
		private songVersionService: SongVersionService,
		private prismaService: PrismaService,
	) {
		super(prismaService, "playlist");
	}

	getTableName() {
		return "playlists";
	}

	protected onCreationFailure(
		error: Error,
		input: PlaylistQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code == PrismaError.UniqueConstraintViolation) {
				return new PlaylistAlreadyExistsException(input.name);
			}
		}
		return this.onUnknownError(error, input);
	}

	protected formatCreateInputToWhereInput(
		input: PlaylistQueryParameters.CreateInput,
	) {
		return {
			slug: new Slug(input.name),
		};
	}

	onNotFound(
		error: Error,
		where: PlaylistQueryParameters.WhereInput,
	): Error | Promise<Error> {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				return new PlaylistNotFoundFromIDException(where.id);
			}
			return new PlaylistNotFoundException(where.slug);
		}
		return this.onUnknownError(error, where);
	}

	formatCreateInput(
		input: PlaylistQueryParameters.CreateInput,
	): Prisma.PlaylistCreateInput {
		return {
			name: input.name,
			slug: new Slug(input.name).toString(),
		};
	}

	formatWhereInput(input: PlaylistQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
		};
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): PlaylistQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const [slug] = parseIdentifierSlugs(stringIdentifier, 1);

				return { slug };
			},
		);
	}

	formatManyWhereInput(
		input: PlaylistQueryParameters.ManyWhereInput,
	): Prisma.PlaylistWhereInput {
		return {
			id: input.id,
			entries: input.song
				? {
						some: {
							songVersion: {
								song: SongService.formatWhereInput(input.song),
							},
						},
				  }
				: input.version
				? {
						some: {
							songVersion: SongVersionService.formatWhereInput(
								input.version,
							),
						},
				  }
				: input.album
				? {
						some: {
							songVersion: {
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
		};
	}

	formatSortingInput(
		sortingParameter: PlaylistQueryParameters.SortingParameter,
	) {
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "creationDate":
				return { createdAt: sortingParameter.order };
			case "entryCount":
				return { entries: { _count: sortingParameter.order } };
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	formatUpdateInput(
		what: PlaylistQueryParameters.UpdateInput,
	): Prisma.PlaylistUpdateInput {
		return {
			name: what.name,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		};
	}

	async onUpdateFailure(
		error: Error,
		what: PlaylistQueryParameters.CreateInput,
		where: PlaylistQueryParameters.WhereInput,
	) {
		const err = this.onCreationFailure(error, what);

		if (err instanceof UnhandledORMErrorException) {
			return this.onNotFound(error, where);
		}
		return err;
	}

	formatDeleteInput(
		where: PlaylistQueryParameters.DeleteInput,
	): Prisma.PlaylistWhereUniqueInput {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(
		input: PlaylistQueryParameters.DeleteInput,
	) {
		return input;
	}

	/**
	 * Reorders a plyalist using list of entry ids
	 * @param where the query parametrs to find the playlist
	 * @param entryIds the list of entry ids of the playlist
	 * The list must be complete
	 */
	async reorderPlaylist(
		where: PlaylistQueryParameters.WhereInput,
		entryIds: number[],
	) {
		const playlist = await this.get(where, { entries: true });
		const entries = playlist.entries;

		const missingEntryIds = entries.filter(
			({ id }) => entryIds.indexOf(id) == -1,
		);
		const unknownEntryIds = entryIds.filter(
			(id) => !entries.find((entry) => entry.id == id),
		);

		if (
			entries.length != entryIds.length ||
			unknownEntryIds.length != 0 ||
			missingEntryIds.length != 0
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
	async removeEntry(entryId: number) {
		const deleted = await this.prismaService.playlistEntry
			.delete({ where: { id: entryId } })
			.catch(() => {
				throw new PlaylistEntryNotFoundException(entryId);
			});

		await this.flatten({ id: deleted.playlistId });
	}

	/**
	 * Add song at the end of a playlist
	 * @param song the query parameters to find the song
	 * @param playlist the query parameters to find the playlist
	 */
	async addSong(
		songVersion: SongVersionQueryParameters.WhereInput,
		playlist: PlaylistQueryParameters.WhereInput,
	) {
		await Promise.all([
			this.songVersionService.throwIfNotFound(songVersion),
			this.throwIfNotFound(playlist),
		]);

		const lastEntry = await this.prismaService.playlistEntry
			.findMany({
				where: { playlist: this.formatWhereInput(playlist) },
				orderBy: { index: "desc" },
				take: 1,
			})
			.then((entries) => entries.at(0));

		try {
			await this.prismaService.playlistEntry.create({
				data: {
					playlist: { connect: this.formatWhereInput(playlist) },
					songVersion: {
						connect:
							SongVersionService.formatWhereInput(songVersion),
					},
					index: (lastEntry?.index ?? -1) + 1,
				},
			});
		} catch (err) {
			this.logger.error(err.message);
			throw new AddSongToPlaylistFailureException();
		}
	}

	/**
	 * Apply correct indexes to playlist entries
	 * @param where the query parameters to find the playlist
	 */
	async flatten(where: PlaylistQueryParameters.WhereInput) {
		const entries = await this.prismaService.playlistEntry.findMany({
			where: { playlist: this.formatWhereInput(where) },
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
		const playlists = await this.getMany({});

		await Promise.all(
			playlists.map((playlist) => this.flatten({ id: playlist.id })),
		);
	}
}
