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
	ArtistAlreadyExistsException,
	ArtistNotEmptyException,
	ArtistNotFoundByIDException,
	ArtistNotFoundException,
	CompilationArtistException,
} from "./artist.exceptions";
import { Prisma } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import type ArtistQueryParameters from "./models/artist.query-parameters";
import {
	type PaginationParameters,
	buildPaginationParameters,
} from "src/pagination/models/pagination-parameters";
import RepositoryService from "src/repository/repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import GenreService from "src/genre/genre.service";
import ReleaseService from "src/release/release.service";
import TrackService from "src/track/track.service";
import type { Artist, ArtistWithRelations } from "src/prisma/models";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import IllustrationRepository from "src/illustration/illustration.repository";
import deepmerge from "deepmerge";

@Injectable()
export default class ArtistService extends RepositoryService<
	ArtistWithRelations,
	ArtistQueryParameters.CreateInput,
	ArtistQueryParameters.WhereInput,
	ArtistQueryParameters.ManyWhereInput,
	ArtistQueryParameters.UpdateInput,
	ArtistQueryParameters.DeleteInput,
	ArtistQueryParameters.SortingKeys,
	Prisma.ArtistCreateInput,
	Prisma.ArtistWhereInput,
	Prisma.ArtistWhereInput,
	Prisma.ArtistUpdateInput,
	Prisma.ArtistWhereUniqueInput,
	Prisma.ArtistOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(ArtistService.name);
	constructor(
		private prismaService: PrismaService,
		private illustrationRepository: IllustrationRepository,
	) {
		super(prismaService, "artist");
	}

	getTableName() {
		return "artists";
	}

	/**
	 * Artist Creation
	 */
	formatCreateInput(
		input: ArtistQueryParameters.CreateInput,
	): Prisma.ArtistCreateInput {
		return {
			name: input.name,
			registeredAt: input.registeredAt,
			slug: new Slug(input.name).toString(),
		};
	}

	protected formatCreateInputToWhereInput(
		input: ArtistQueryParameters.CreateInput,
	) {
		return { slug: new Slug(input.name) };
	}

	protected onCreationFailure(
		error: Error,
		input: ArtistQueryParameters.CreateInput,
	): Error {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.UniqueConstraintViolation
		) {
			return new ArtistAlreadyExistsException(new Slug(input.name));
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * Get Artist
	 */
	checkWhereInputIntegrity(input: ArtistQueryParameters.WhereInput): void {
		if (input.compilationArtist) {
			throw new CompilationArtistException("Artist");
		}
	}

	static formatWhereInput(input: ArtistQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
		};
	}

	formatWhereInput = ArtistService.formatWhereInput;
	onNotFound(error: Error, where: ArtistQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				return new ArtistNotFoundByIDException(where.id);
			}
			return new ArtistNotFoundException(where.slug!);
		}
		return this.onUnknownError(error, where);
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
						versions: {
							some: {
								tracks: {
									some: TrackService.formatManyWhereInput({
										library: where.library,
									}),
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
								versions: {
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

	formatManyWhereInput = ArtistService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): ArtistQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const [slug] = parseIdentifierSlugs(stringIdentifier, 1);

				if (slug.toString() == compilationAlbumArtistKeyword) {
					return { compilationArtist: true };
				}
				return { slug };
			},
		);
	}

	formatSortingInput(
		sortingParameter: ArtistQueryParameters.SortingParameter,
	): Prisma.ArtistOrderByWithRelationAndSearchRelevanceInput {
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

	/**
	 * Update Artist
	 */
	formatUpdateInput(what: ArtistQueryParameters.UpdateInput) {
		return {
			name: what.name,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		};
	}

	/**
	 * Artist deletion
	 */
	formatDeleteInput(where: ArtistQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(
		input: ArtistQueryParameters.DeleteInput,
	) {
		return input;
	}

	/**
	 * Deletes an artist
	 * @param where the query parameters to find the album to delete
	 */
	async delete(where: ArtistQueryParameters.DeleteInput): Promise<Artist> {
		await this.illustrationRepository.deleteArtistIllustration(where, {
			withFolder: true,
		});
		const deletedArtist = await super.delete(where);

		this.logger.warn(`Artist '${deletedArtist.slug}' deleted`);
		return deletedArtist;
	}

	onDeletionFailure(error: Error, input: ArtistQueryParameters.DeleteInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.ForeignConstraintViolation
		) {
			return new ArtistNotEmptyException(input.slug ?? input.id);
		}
		return super.onDeletionFailure(error, input);
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

		await Promise.allSettled(
			emptyArtists.map(({ id }) => this.delete({ id })),
		);
	}

	/**
	 * Search for artists
	 * The token is used to look through an artist's name, or their songs or album
	 */
	public async search<I extends ArtistQueryParameters.RelationInclude>(
		token: string,
		where: ArtistQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: ArtistQueryParameters.SortingParameter,
	) {
		if (token.length == 0) {
			return [];
		}
		// Transforms the toke into a slug, and remove trailing excl. mark if token is numeric
		const slug = new Slug(token).toString().replace("!", "");
		const ormSearchToken = slug.split(Slug.separator);
		const ormSearchFilter = ormSearchToken.map((subToken: string) => ({
			contains: subToken,
		}));

		return this.prismaService.artist.findMany({
			...buildPaginationParameters(pagination),
			orderBy: sort
				? this.formatSortingInput(sort)
				: {
						_relevance: {
							fields: ["slug"],
							search: slug,
							sort: "asc",
						},
				  },
			include: this.formatInclude(include),
			where: {
				...this.formatManyWhereInput(where),
				OR: [
					...ormSearchFilter.map((filter) => ({ slug: filter })),
					// ...ormSearchFilter.map((filter) => ({ songs: { some: { slug: filter } } })),
					// ...ormSearchFilter.map((filter) => ({
					// 	albums: { some: { releases: { some: { slug: filter } } } }
					// }))
				],
			},
		});
	}
}
