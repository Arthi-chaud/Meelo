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
import type { LyricsWithRelations } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import RepositoryService from "src/repository/repository.service";
import SongService from "src/song/song.service";
import {
	LyricsAlreadyExistsExceptions,
	LyricsNotFoundByIDException,
	LyricsNotFoundBySongException,
} from "./lyrics.exceptions";
import type LyricsQueryParameters from "./models/lyrics.query-parameters";
import { Lyrics, Prisma } from "@prisma/client";
import Identifier from "src/identifier/models/identifier";
import { PrismaError } from "prisma-error-enum";
import Slug from "src/slug/slug";
import ProviderService from "src/providers/provider.service";
import Logger from "src/logger/logger";
import MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";

@Injectable()
export class LyricsService extends RepositoryService<
	LyricsWithRelations,
	LyricsQueryParameters.CreateInput,
	LyricsQueryParameters.WhereInput,
	LyricsQueryParameters.ManyWhereInput,
	LyricsQueryParameters.UpdateInput,
	LyricsQueryParameters.DeleteInput,
	[],
	Prisma.LyricsCreateInput,
	Prisma.LyricsWhereInput,
	Prisma.LyricsWhereInput,
	Prisma.LyricsUpdateInput,
	Prisma.LyricsWhereUniqueInput,
	Prisma.LyricsOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(LyricsService.name);
	constructor(
		@InjectMeiliSearch() private readonly meiliSearch: MeiliSearch,
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
	) {
		super(prismaService, "lyrics");
	}

	getTableName() {
		return "lyrics";
	}

	/**
	 * Create
	 */
	formatCreateInput(input: LyricsQueryParameters.CreateInput) {
		return {
			content: input.content,
			song: { connect: { id: input.songId } },
		};
	}

	protected formatCreateInputToWhereInput(
		input: LyricsQueryParameters.CreateInput,
	) {
		return { song: { id: input.songId } };
	}

	protected onCreated(lyrics: Lyrics) {
		this.meiliSearch
			.index(this.songService.getTableName())
			.updateDocuments([{ id: lyrics.songId, lyrics: lyrics.content }], {
				primaryKey: "id",
			});
	}

	protected onDeleted(lyrics: Lyrics) {
		this.meiliSearch
			.index(this.songService.getTableName())
			.updateDocuments([{ id: lyrics.songId, lyrics: null }], {
				primaryKey: "id",
			});
	}

	protected async onCreationFailure(
		error: Error,
		input: LyricsQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const parentSong = await this.songService.get({ id: input.songId });

			if (error.code == PrismaError.RequiredRelationViolation) {
				return new LyricsAlreadyExistsExceptions(
					new Slug(parentSong.slug),
				);
			}
		}
		throw this.onUnknownError(error, input);
	}

	/**
	 * Get
	 */
	static formatWhereInput(input: LyricsQueryParameters.WhereInput) {
		return {
			id: input.id,
			song: input.song
				? SongService.formatWhereInput(input.song)
				: undefined,
		};
	}

	formatWhereInput = LyricsService.formatWhereInput;

	static formatManyWhereInput(input: LyricsQueryParameters.ManyWhereInput) {
		return {
			song: input.songs
				? SongService.formatManyWhereInput(input.songs)
				: undefined,
			id: input.id,
		};
	}

	formatManyWhereInput = LyricsService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): LyricsQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			RepositoryService.UnexpectedStringIdentifier,
		);
	}

	formatSortingInput<S extends LyricsQueryParameters.SortingParameter>(
		sortingParameter: S,
	) {
		return { id: sortingParameter.order };
	}

	/**
	 * Update
	 */
	async update(
		what: LyricsQueryParameters.UpdateInput,
		where: LyricsQueryParameters.WhereInput,
	) {
		if (where.id != undefined) {
			return super.update(what, { id: where.id });
		}
		let songId: number | undefined = where.song?.id;

		if (where.song?.bySlug) {
			songId = (await this.songService.select(where.song, { id: true }))
				.id;
		}
		try {
			return await this.prismaService.lyrics.update({
				data: this.formatUpdateInput(what),
				where: this.formatDeleteInput({ songId: songId! }),
			});
		} catch (error) {
			throw await this.onUpdateFailure(error, what, where);
		}
	}

	formatUpdateInput(what: LyricsQueryParameters.UpdateInput) {
		return {
			content: what.content,
		};
	}

	formatDeleteInput(where: LyricsQueryParameters.DeleteInput) {
		return {
			id: where.id,
			songId: where.songId,
		};
	}

	protected formatDeleteInputToWhereInput(
		input: LyricsQueryParameters.DeleteInput,
	): LyricsQueryParameters.WhereInput {
		if (input.id) {
			return { id: input.id };
		}
		return { song: { id: input.songId! } };
	}

	/**
	 * Returns an exception for when a lyric is not found in the database
	 * @param where the queryparameters used to find the lyrics
	 */
	async onNotFound(error: Error, where: LyricsQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.song) {
				await this.songService.throwIfNotFound(where.song);
				return new LyricsNotFoundBySongException(
					where.song.id ?? where.song.bySlug!.slug,
				);
			}
			return new LyricsNotFoundByIDException(where.id);
		}
		throw this.onUnknownError(error, where);
	}

	async housekeeping(): Promise<void> {}

	async fetchMissingLyrics() {
		const songs = await this.prismaService.song.findMany({
			where: { lyrics: null },
			include: { externalIds: true },
		});

		for (const song of songs) {
			try {
				const lyrics = await this.providerService.runAction(
					async (provider) => {
						const songExternalId = song.externalIds.find(
							(id) =>
								this.providerService.getProviderById(
									id.providerId,
								).name == provider.name,
						)?.value;

						if (!songExternalId) {
							throw new Error("Missing External ID");
						}
						return provider.getSongLyrics(songExternalId);
					},
				);

				this.logger.verbose(`Lyrics found for song '${song.name}'`);
				await this.create({ content: lyrics, songId: song.id });
			} catch {
				continue;
			}
		}
	}
}
