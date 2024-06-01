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
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import type GenreQueryParameters from "./models/genre.query-parameters";
import { Genre } from "src/prisma/models";
import SongService from "src/song/song.service";
import RepositoryService from "src/repository/repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import ArtistService from "src/artist/artist.service";
import { Prisma } from "@prisma/client";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import {
	GenreAlreadyExistsException,
	GenreNotEmptyException,
	GenreNotFoundException,
} from "./genre.exceptions";
import AlbumService from "src/album/album.service";
import deepmerge from "deepmerge";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";

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
		let query: Prisma.GenreWhereInput = {};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.slug) {
			query = deepmerge(query, {
				slug: buildStringSearchParameters(where.slug),
			});
		}
		if (where.song) {
			query = deepmerge(query, {
				songs: { some: SongService.formatWhereInput(where.song) },
			});
		}
		if (where.artist) {
			query = deepmerge(query, {
				songs: {
					some: {
						artist: ArtistService.formatWhereInput(where.artist),
					},
				},
			});
		}
		if (where.album) {
			query = deepmerge(query, {
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
		return query;
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): GenreQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const [slug] = parseIdentifierSlugs(stringIdentifier, 1);

				return { slug };
			},
		);
	}

	formatSortingInput(
		sortingParameter: GenreQueryParameters.SortingParameter,
	) {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "songCount":
				return { songs: { _count: sortingParameter.order } };
			case undefined:
				return { id: sortingParameter.order };
			default:
				return { [sortingParameter.sortBy]: sortingParameter.order };
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
			take: pagination.take,
			skip: pagination.skip,
			cursor: pagination.afterId
				? {
						id: pagination.afterId,
				  }
				: undefined,
			orderBy: this.formatSortingInput(sort),
		};
		const artists = await this.prismaService.genre.findMany<
			Prisma.SelectSubset<typeof args, Prisma.GenreFindManyArgs>
		>(args);
		return artists;
	}

	/**
	 * Deletes a genre
	 * @param where the query parameter to find the genre to delete
	 */
	async delete(where: GenreQueryParameters.DeleteInput): Promise<Genre> {
		const genre = await this.get(where, { songs: true });

		if (genre.songs.length == 0) {
			return this.prismaService.genre
				.delete({
					where: { id: genre.id },
				})
				.then((deleted) => {
					this.logger.warn(`Genre '${deleted.slug}' deleted`);
					return deleted;
				});
		}
		throw new GenreNotEmptyException(genre.id);
	}

	/**
	 * Delete all genres that do not have related songs
	 */
	async housekeeping(): Promise<void> {
		const emptyGenres = await this.prismaService.genre
			.findMany({
				select: {
					id: true,
					_count: {
						select: { songs: true, albums: true },
					},
				},
			})
			.then((genres) =>
				genres.filter(
					(genre) => !genre._count.songs && !genre._count.albums,
				),
			);

		await Promise.all(emptyGenres.map(({ id }) => this.delete({ id })));
	}

	onNotFound(error: Error, where: GenreQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			return new GenreNotFoundException(where.slug ?? where.id);
		}
		return new UnhandledORMErrorException(error, where);
	}
}
