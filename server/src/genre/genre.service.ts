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

import { Injectable } from "@nestjs/common";
import { Prisma } from "src/prisma/generated/client";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import Logger from "src/logger/logger";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import SongService from "src/song/song.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import { GenreNotFoundException } from "./genre.exceptions";
import type GenreQueryParameters from "./models/genre.query-parameters";

@Injectable()
export default class GenreService {
	private readonly logger = new Logger(GenreService.name);
	constructor(private prismaService: PrismaService) {}

	async getOrCreate(input: GenreQueryParameters.CreateInput) {
		const genreSlug = new Slug(input.name);
		return this.prismaService.genre.upsert({
			create: {
				name: input.name,
				slug: genreSlug.toString(),
			},
			update: {},
			where: { slug: genreSlug.toString() },
		});
	}

	/**
	 * Find a genre
	 */
	static formatWhereInput(input: GenreQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input?.slug?.toString(),
		};
	}

	static formatManyWhereInput(where: GenreQueryParameters.ManyWhereInput) {
		const query: Prisma.GenreWhereInput[] = [];

		if (where.genres) {
			query.push({
				OR: where.genres.map((genre) =>
					GenreService.formatWhereInput(genre),
				),
			});
		}
		if (where.slug) {
			query.push({
				slug: buildStringSearchParameters(where.slug),
			});
		}
		if (where.song) {
			query.push({
				songs: { some: SongService.formatWhereInput(where.song) },
			});
		}
		if (where.artist) {
			query.push({
				songs: {
					some: {
						artist: ArtistService.formatWhereInput(where.artist),
					},
				},
			});
		}
		if (where.album) {
			query.push({
				OR: [
					{
						songs: {
							some: {
								tracks: {
									some: {
										release: {
											album: AlbumService.formatWhereInput(
												where.album,
											),
										},
									},
								},
							},
						},
					},
					{
						albums: {
							some: AlbumService.formatWhereInput(where.album),
						},
					},
				],
			});
		}
		return { AND: query };
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	formatSortingInput(
		sortingParameter: GenreQueryParameters.SortingParameter,
	): Prisma.GenreOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ slug: sortingParameter.order }];
			case "songCount":
				return [
					{ songs: { _count: sortingParameter.order } },
					{ slug: "asc" },
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

	async get<I extends GenreQueryParameters.RelationInclude = {}>(
		where: GenreQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			where: GenreService.formatWhereInput(where),
			include: include ?? ({} as I),
		};
		return this.prismaService.genre
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.GenreFindFirstOrThrowArgs
				>
			>(args)
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	async getMany<I extends GenreQueryParameters.RelationInclude = {}>(
		where: GenreQueryParameters.ManyWhereInput,
		sort: GenreQueryParameters.SortingParameter = {},
		pagination: PaginationParameters = {},
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: GenreService.formatManyWhereInput(where),
			orderBy: this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		const artists =
			await this.prismaService.genre.findMany<
				Prisma.SelectSubset<typeof args, Prisma.GenreFindManyArgs>
			>(args);
		return artists;
	}

	/**
	 * Delete genres
	 * Note: Will delete genre even if not empty
	 * @param where the query parameter to find the genres to delete
	 */
	async delete(where: GenreQueryParameters.DeleteInput[]): Promise<number> {
		if (!where.length) {
			return 0;
		}
		const deleted = await this.prismaService.genre.deleteMany({
			where: GenreService.formatManyWhereInput({ genres: where }),
		});

		return deleted.count;
	}

	/**
	 * Delete all genres that do not have related songs
	 */
	async housekeeping(): Promise<void> {
		const emptyGenres = await this.prismaService.genre.findMany({
			select: {
				id: true,
			},
			where: { songs: { none: {} }, albums: { none: {} } },
		});
		const deletedGenreCount =
			emptyGenres.length > 0
				? await this.delete(
						emptyGenres.map((genre) => ({ id: genre.id })),
					)
				: 0;

		if (deletedGenreCount) {
			this.logger.warn(`Deleted ${deletedGenreCount} genres`);
		}
	}

	onNotFound(error: Error, where: GenreQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			return new GenreNotFoundException(where.slug ?? where.id);
		}
		return new UnhandledORMErrorException(error, where);
	}
}
