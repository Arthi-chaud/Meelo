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
import ArtistService from "src/artist/artist.service";
import Slug from "src/slug/slug";
import {
	AlbumAlreadyExistsException,
	AlbumAlreadyExistsWithArtistIDException,
	AlbumNotEmptyException,
	AlbumNotFoundException,
	AlbumNotFoundFromIDException,
} from "./album.exceptions";
import { Prisma } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import AlbumQueryParameters from "./models/album.query-parameters";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import ReleaseService from "src/release/release.service";
import RepositoryService, {
	SearchableRepositoryService,
} from "src/repository/repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import SongService from "src/song/song.service";
import { Album, AlbumWithRelations } from "src/prisma/models";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import { PrismaError } from "prisma-error-enum";
import IllustrationRepository from "src/illustration/illustration.repository";
import ParserService from "src/scanner/parser.service";
import deepmerge from "deepmerge";
import GenreService from "src/genre/genre.service";
import MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";

@Injectable()
export default class AlbumService extends SearchableRepositoryService<
	AlbumWithRelations,
	AlbumQueryParameters.CreateInput,
	AlbumQueryParameters.WhereInput,
	AlbumQueryParameters.ManyWhereInput,
	AlbumQueryParameters.UpdateInput,
	AlbumQueryParameters.DeleteInput,
	AlbumQueryParameters.SortingKeys,
	Prisma.AlbumCreateInput,
	Prisma.AlbumWhereInput,
	Prisma.AlbumWhereInput,
	Prisma.AlbumUpdateInput,
	Prisma.AlbumWhereUniqueInput,
	Prisma.AlbumOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(AlbumService.name);
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistServce: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
		private illustrationRepository: IllustrationRepository,
		@InjectMeiliSearch()
		protected readonly meiliSearch: MeiliSearch,
	) {
		super(prismaService, "album", ["name", "slug"], meiliSearch);
	}

	getTableName() {
		return "albums";
	}

	/**
	 * Create an Album
	 */
	async create<I extends AlbumQueryParameters.RelationInclude>(
		album: AlbumQueryParameters.CreateInput,
		include?: I,
	) {
		if (album.artist === undefined) {
			if (
				(await this.count({
					name: { is: album.name },
					artist: { compilationArtist: true },
				})) != 0
			) {
				throw new AlbumAlreadyExistsException(new Slug(album.name));
			}
		}
		return super.create(album, include);
	}

	formatSearchableEntries(created: Album) {
		return {
			id: created.id,
			slug: created.slug,
			name: created.name,
			type: created.type,
		};
	}

	formatCreateInput(input: AlbumQueryParameters.CreateInput) {
		return {
			name: input.name,
			artist: input.artist
				? {
						connect: ArtistService.formatWhereInput(input.artist),
				  }
				: undefined,
			slug: new Slug(input.name).toString(),
			releaseDate: input.releaseDate,
			registeredAt: input.registeredAt,
			type: this.parserService.getAlbumType(input.name),
		};
	}

	protected formatCreateInputToWhereInput(
		where: AlbumQueryParameters.CreateInput,
	) {
		return {
			bySlug: { slug: new Slug(where.name), artist: where.artist },
		};
	}

	protected async onCreationFailure(
		error: Error,
		input: AlbumQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const albumSlug = new Slug(input.name);

			if (input.artist) {
				await this.artistServce.get(input.artist);
			}
			if (error.code == PrismaError.UniqueConstraintViolation) {
				if (input.artist?.id) {
					return new AlbumAlreadyExistsWithArtistIDException(
						albumSlug,
						input.artist.id,
					);
				}
				return new AlbumAlreadyExistsException(
					albumSlug,
					input.artist?.slug,
				);
			}
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * Find an album
	 */
	static formatWhereInput(where: AlbumQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug
				? where.bySlug.artist
					? ArtistService.formatWhereInput(where.bySlug.artist)
					: null
				: undefined,
		};
	}

	formatWhereInput = AlbumService.formatWhereInput;

	static formatManyWhereInput(where: AlbumQueryParameters.ManyWhereInput) {
		let query: Prisma.AlbumWhereInput = {
			type: where.type,
			name: buildStringSearchParameters(where.name),
		};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.related) {
			// Related albums have at least one song group in common
			// Such song must have at least one audio track
			query = deepmerge(query, {
				NOT: this.formatWhereInput(where.related),
				releases: {
					some: {
						tracks: {
							some: {
								type: "Audio",
								song: {
									group: {
										versions: {
											some: {
												tracks: {
													some: {
														type: "Audio",
														release: {
															album: this.formatWhereInput(
																where.related,
															),
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			});
		}
		if (where.library) {
			query = deepmerge(query, {
				releases: {
					some: ReleaseService.formatManyWhereInput({
						library: where.library,
					}),
				},
			});
		}
		if (where.genre) {
			query = deepmerge(query, {
				OR: [
					{
						releases: {
							some: {
								tracks: {
									some: {
										song: SongService.formatManyWhereInput({
											genre: where.genre,
										}),
									},
								},
							},
						},
					},
					{
						genres: {
							some: GenreService.formatWhereInput(where.genre),
						},
					},
				],
			});
		}
		if (where.appearance) {
			query = deepmerge(query, {
				releases: {
					some: {
						tracks: {
							some: {
								song: {
									OR: [
										{
											artist: ArtistService.formatWhereInput(
												where.appearance,
											),
										},
										{
											featuring: {
												some: ArtistService.formatWhereInput(
													where.appearance,
												),
											},
										},
									],
								},
							},
						},
					},
				},
				artist: {
					isNot: ArtistService.formatWhereInput(where.appearance),
				},
			});
		}
		if (where.artist?.compilationArtist) {
			query = deepmerge(query, {
				artist: null,
			});
		} else if (where.artist) {
			query = deepmerge(query, {
				artist: { is: ArtistService.formatWhereInput(where.artist) },
			});
		}
		return query;
	}

	formatManyWhereInput = AlbumService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): AlbumQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const slugs = parseIdentifierSlugs(stringIdentifier, 2);

				return {
					bySlug: {
						slug: slugs[1],
						artist:
							slugs[0].toString() == compilationAlbumArtistKeyword
								? undefined
								: { slug: slugs[0] },
					},
				};
			},
		);
	}

	formatSortingInput(
		sortingParameter: AlbumQueryParameters.SortingParameter,
	): Prisma.AlbumOrderByWithRelationAndSearchRelevanceInput {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "artistName":
				return {
					artist: this.artistServce.formatSortingInput({
						sortBy: "name",
						order: sortingParameter.order,
					}),
				};
			case "addDate":
				return { registeredAt: sortingParameter.order };
			case "releaseDate":
				return {
					releaseDate: {
						sort: sortingParameter.order,
						nulls: "last",
					},
				};
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	/**
	 * Updates an album
	 */
	formatUpdateInput(what: AlbumQueryParameters.UpdateInput) {
		return {
			...what,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		};
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	async updateAlbumDate(where: AlbumQueryParameters.WhereInput) {
		const album = await this.get(where, { releases: true });

		album.releaseDate = album.releases?.at(0)?.releaseDate ?? null;
		for (const release of album.releases) {
			if (
				album.releaseDate == null ||
				(release.releaseDate && release.releaseDate < album.releaseDate)
			) {
				album.releaseDate = release.releaseDate;
			}
		}
		return this.update(
			{ releaseDate: album.releaseDate },
			{ id: album.id },
		);
	}

	/**
	 * Deletes an album
	 * @param where the query parameter
	 */
	async delete(where: AlbumQueryParameters.DeleteInput): Promise<Album> {
		await this.illustrationRepository.deleteAlbumIllustrations(where);
		const album = await super.delete(where);

		this.logger.warn(`Album '${album.slug}' deleted`);
		return album;
	}

	onDeletionFailure(error: Error, input: AlbumQueryParameters.DeleteInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.ForeignConstraintViolation
		) {
			return new AlbumNotEmptyException(input.id);
		}
		return super.onDeletionFailure(error, input);
	}

	formatDeleteInput(where: AlbumQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(
		input: AlbumQueryParameters.DeleteInput,
	) {
		return input;
	}

	/**
	 * Delete all albums that do not have relaed releases
	 */
	async housekeeping(): Promise<void> {
		const emptyAlbums = await this.prismaService.album
			.findMany({
				select: {
					id: true,
					_count: {
						select: { releases: true },
					},
				},
			})
			.then((albums) => albums.filter((album) => !album._count.releases));

		await Promise.all(emptyAlbums.map(({ id }) => this.delete({ id })));
	}

	/**
	 * Set the release as album's master
	 * @param releaseWhere the query parameters of the release
	 * @returns the updated album
	 */
	async setMasterRelease(releaseWhere: ReleaseQueryParameters.WhereInput) {
		const release = await this.releaseService.select(releaseWhere, {
			id: true,
			albumId: true,
		});

		return this.prismaService.album.update({
			where: { id: release.albumId },
			data: { masterId: release.id },
		});
	}

	/**
	 * unset album's master release
	 * @param albumWhere the query parameters of the album
	 * @returns the updated album
	 */
	async unsetMasterRelease(albumWhere: AlbumQueryParameters.WhereInput) {
		return this.prismaService.album.update({
			where: AlbumService.formatWhereInput(albumWhere),
			data: { masterId: null },
		});
	}

	/**
	 * Change an album's artist
	 * @param albumWhere the query parameters to find the album to reassign
	 * @param artistWhere the query parameters to find the artist to reassign the album to
	 */
	async reassign(
		albumWhere: AlbumQueryParameters.WhereInput,
		artistWhere: ArtistQueryParameters.WhereInput,
	): Promise<Album> {
		const album = await this.get(albumWhere, { artist: true });
		const previousArtistSlug = album.artist
			? new Slug(album.artist.slug)
			: undefined;
		const albumSlug = new Slug(album.slug);
		const newArtist = artistWhere.compilationArtist
			? null
			: await this.artistServce.get(artistWhere, { albums: true });
		const newArtistSlug = newArtist ? new Slug(newArtist.slug) : undefined;
		const artistAlbums = newArtist
			? newArtist.albums
			: await this.getMany({ artist: { compilationArtist: true } });

		//Check if an album with the same name already exist for the new artist
		if (
			artistAlbums.find((artistAlbum) => album.slug == artistAlbum.slug)
		) {
			throw new AlbumAlreadyExistsException(albumSlug, newArtistSlug);
		}
		const updatedAlbum = await this.update(
			{ artistId: newArtist?.id ?? null },
			albumWhere,
		);

		this.illustrationRepository.reassignAlbumIllustration(
			albumSlug.toString(),
			previousArtistSlug?.toString(),
			newArtistSlug?.toString(),
		);
		return updatedAlbum;
	}

	async onNotFound(error: Error, where: AlbumQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				return new AlbumNotFoundFromIDException(where.id);
			}
			if (where.bySlug.artist) {
				await this.artistServce.throwIfNotFound(where.bySlug.artist);
			}
			return new AlbumNotFoundException(
				where.bySlug.slug,
				where.bySlug.artist?.slug,
			);
		}
		return this.onUnknownError(error, where);
	}
}
