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
import type PrismaService from "src/prisma/prisma.service";
import SongService from "src/song/song.service";
import {
	LyricsAlreadyExistsExceptions,
	LyricsNotFoundBySongException,
} from "./lyrics.exceptions";
import type LyricsQueryParameters from "./models/lyrics.query-parameters";
import { Prisma } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import Slug from "src/slug/slug";
import Logger from "src/logger/logger";
import type MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";

@Injectable()
export class LyricsService {
	private readonly logger = new Logger(LyricsService.name);
	constructor(
		@InjectMeiliSearch() private readonly meiliSearch: MeiliSearch,
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {}

	async createOrUpdate(input: LyricsQueryParameters.CreateInput) {
		return this.prismaService.lyrics
			.upsert({
				update: {
					content: input.content,
				},
				create: {
					content: input.content,
					songId: input.songId,
				},
				where: {
					songId: input.songId,
				},
			})
			.then((lyrics) => {
				this.meiliSearch
					.index(this.songService.getTableName())
					.updateDocuments(
						[{ id: lyrics.songId, lyrics: lyrics.content }],
						{
							primaryKey: "id",
						},
					);
				return lyrics;
			})
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const parentSong = await this.songService.get({
						id: input.songId,
					});

					if (error.code === PrismaError.RequiredRelationViolation) {
						throw new LyricsAlreadyExistsExceptions(
							new Slug(parentSong.slug),
						);
					}
				}
				throw new UnhandledORMErrorException(error, input);
			});
	}

	async get(where: LyricsQueryParameters.WhereInput) {
		return this.prismaService.lyrics
			.findFirstOrThrow({
				where: {
					songId: where.songId,
				},
			})
			.catch(async (error) => {
				await this.songService.get({ id: where.songId });
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.RecordsNotFound) {
						throw new LyricsNotFoundBySongException(where.songId);
					}
				}
				throw new UnhandledORMErrorException(error, where);
			});
	}

	async delete(where: LyricsQueryParameters.WhereInput) {
		return this.prismaService.lyrics
			.delete({
				where: {
					songId: where.songId,
				},
			})
			.then((res) => {
				this.meiliSearch
					.index(this.songService.getTableName())
					.updateDocuments([{ id: where.songId, lyrics: null }], {
						primaryKey: "id",
					});
				return res;
			})
			.catch(async () => {
				await this.songService.get({ id: where.songId });
				throw new LyricsNotFoundBySongException(where.songId);
			});
	}

	async housekeeping(): Promise<void> {}
}
