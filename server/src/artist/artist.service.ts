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
import Slug from "src/slug/slug";
import {
	ArtistNotEmptyException,
	ArtistNotFoundException,
	CompilationArtistException,
} from "./artist.exceptions";
import { Prisma } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import type ArtistQueryParameters from "./models/artist.query-parameters";
import SearchableRepositoryService from "src/repository/searchable-repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import GenreService from "src/genre/genre.service";
import ReleaseService from "src/release/release.service";
import TrackService from "src/track/track.service";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import IllustrationRepository from "src/illustration/illustration.repository";
import deepmerge from "deepmerge";
import MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";

@Injectable()
export default class ArtistService extends SearchableRepositoryService {
	private readonly logger = new Logger(ArtistService.name);
	constructor(
		@InjectMeiliSearch() protected readonly meiliSearch: MeiliSearch,
		private prismaService: PrismaService,
		private illustrationRepository: IllustrationRepository,
	) {
		super("artist", ["name", "slug"], meiliSearch);
	}

	async get<I extends ArtistQueryParameters.RelationInclude = {}>(
		where: ArtistQueryParameters.WhereInput,
		include?: I,
	) {
		if (where.compilationArtist) {
			throw new CompilationArtistException("get");
		}
		const args = {
			include: include ?? ({} as I),
			where: ArtistService.formatWhereInput(where),
		};
		const artist = await this.prismaService.artist
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.ArtistFindFirstOrThrowArgs
				>
			>(args)
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
		return artist;
	}

	async search<I extends ArtistQueryParameters.RelationInclude = {}>(
		token: string,
		where: ArtistQueryParameters.ManyWhereInput,
		pagination: PaginationParameters = {},
		include?: I,
	) {
		const matchingIds = await this.getMatchingIds(token, pagination);
		const artists = await this.getMany(
			{ ...where, id: { in: matchingIds } },
			{},
			{},
			include,
		);

		return this.sortItemsUsingMatchList(matchingIds, artists);
	}

	async getMany<I extends ArtistQueryParameters.RelationInclude = {}>(
		where: ArtistQueryParameters.ManyWhereInput,
		sort: ArtistQueryParameters.SortingParameter = {},
		pagination: PaginationParameters = {},
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: ArtistService.formatManyWhereInput(where),
			orderBy: this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		const artists = await this.prismaService.artist.findMany<
			Prisma.SelectSubset<typeof args, Prisma.ArtistFindManyArgs>
		>(args);
		return artists;
	}

	async create(input: ArtistQueryParameters.CreateInput) {
		const artistSlug = new Slug(input.name);
		return this.prismaService.artist
			.create({
				data: {
					name: input.name,
					registeredAt: input.registeredAt,
					slug: artistSlug.toString(),
				},
			})
			.then((artist) => {
				this.meiliSearch.index(this.indexName).addDocuments([
					{
						id: artist.id,
						slug: artist.slug,
						name: artist.name,
					},
				]);
				return artist;
			})
			.catch((error) => {
				throw new UnhandledORMErrorException(error, input);
			});
	}

	async getOrCreate(input: ArtistQueryParameters.CreateInput) {
		const artistSlug = new Slug(input.name);
		try {
			return await this.get({ slug: artistSlug });
		} catch {
			return this.create(input);
		}
	}

	static formatWhereInput(input: ArtistQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
		};
	}

	onNotFound(error: Error, where: ArtistQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			return new ArtistNotFoundException(where.id ?? where.slug!);
		}
		return new UnhandledORMErrorException(error, where);
	}

	/**
	 * Get Artists
	 */
	static formatManyWhereInput(where: ArtistQueryParameters.ManyWhereInput) {
		let query: Prisma.ArtistWhereInput = {
			name: buildStringSearchParameters(where.name),
		};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.library) {
			query = deepmerge(query, {
				albums: {
					some: {
						releases: {
							some: ReleaseService.formatManyWhereInput({
								library: where.library,
							}),
						},
					},
				},
				songs: {
					some: {
						tracks: {
							some: {
								song: {
									tracks: {
										some: TrackService.formatManyWhereInput(
											{ library: where.library },
										),
									},
								},
							},
						},
					},
				},
			});
		}
		if (where.genre) {
			query = deepmerge(query, {
				songs: {
					some: {
						genres: {
							some: GenreService.formatWhereInput(where.genre),
						},
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
						featuredOn: {
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
				],
			});
		}
		if (where.albumArtistOnly) {
			query = deepmerge(query, {
				NOT: { albums: { none: {} } },
			});
		}

		return query;
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): ArtistQueryParameters.WhereInput {
		return formatIdentifier(identifier, (stringIdentifier) => {
			if (stringIdentifier.toString() == compilationAlbumArtistKeyword) {
				return { compilationArtist: true };
			}
			return { slug: new Slug(stringIdentifier) };
		});
	}

	formatSortingInput(
		sortingParameter: ArtistQueryParameters.SortingParameter,
	): Prisma.ArtistOrderByWithRelationInput {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "albumCount":
				return { albums: { _count: sortingParameter.order } };
			case "songCount":
				return { songs: { _count: sortingParameter.order } };
			case "addDate":
				return { registeredAt: sortingParameter.order };
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	async delete(where: ArtistQueryParameters.DeleteInput) {
		const artist = await this.get(where);
		if (artist.illustrationId) {
			await this.illustrationRepository.deleteIllustration(
				artist.illustrationId,
			);
		}
		const deletedArtist = await this.prismaService.artist
			.delete({
				where: {
					id: where.id,
					slug: where.slug?.toString(),
				},
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code == PrismaError.ForeignConstraintViolation
				) {
					throw new ArtistNotEmptyException(where.slug ?? where.id);
				}

				throw new UnhandledORMErrorException(error, where);
			});
		this.meiliSearch.index(this.indexName).deleteDocument(deletedArtist.id);
		this.logger.warn(`Artist '${deletedArtist.slug}' deleted`);
		return deletedArtist;
	}

	/**
	 * Call 'delete' method on all artist that do not have any songs or albums
	 */
	async housekeeping(): Promise<void> {
		const emptyArtists = await this.prismaService.artist
			.findMany({
				select: {
					id: true,
					_count: {
						select: { albums: true, songs: true, featuredOn: true },
					},
				},
			})
			.then((artists) =>
				artists.filter(
					({ _count }) =>
						!_count.albums && !_count.songs && !_count.featuredOn,
				),
			);

		await Promise.all(emptyArtists.map(({ id }) => this.delete({ id })));
	}
}
