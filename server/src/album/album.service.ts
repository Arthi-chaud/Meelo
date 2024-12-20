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
	AlbumNotEmptyException,
	AlbumNotFoundException,
} from "./album.exceptions";
import { AlbumType, Prisma } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import AlbumQueryParameters from "./models/album.query-parameters";
import ReleaseService from "src/release/release.service";
import SearchableRepositoryService from "src/repository/searchable-repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import SongService from "src/song/song.service";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import Logger from "src/logger/logger";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import { PrismaError } from "prisma-error-enum";
import ParserService from "src/parser/parser.service";
import deepmerge from "deepmerge";
import GenreService from "src/genre/genre.service";
import MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
	sortItemsUsingOrderedIdList,
} from "src/repository/repository.utils";
import { AlbumModel } from "./models/album.model";
import {
	EventsService,
	ResourceEventPriority,
} from "src/events/events.service";
import { shuffle } from "src/utils/shuffle";

@Injectable()
export default class AlbumService extends SearchableRepositoryService {
	private readonly logger = new Logger(AlbumService.name);
	constructor(
		private eventService: EventsService,
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistServce: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
		@InjectMeiliSearch()
		protected readonly meiliSearch: MeiliSearch,
	) {
		super("albums", ["name", "slug", "nameSlug", "type"], meiliSearch);
	}

	async getOrCreate<I extends AlbumQueryParameters.RelationInclude = {}>(
		album: AlbumQueryParameters.CreateInput,
		include?: I,
	) {
		try {
			const artist = album.artist
				? await this.artistServce.get(album.artist)
				: undefined;
			return await this.get(
				{
					slug: new Slug(
						artist?.name ?? compilationAlbumArtistKeyword,
						album.name,
					),
				},
				include,
			);
		} catch {
			return this.create(album);
		}
	}

	/**
	 * Create an Album
	 */
	async create(album: AlbumQueryParameters.CreateInput) {
		if (album.artist === undefined) {
			if (
				(await this.prismaService.album.count({
					where: {
						name: album.name,
						artist: null,
					},
				})) != 0
			) {
				throw new AlbumAlreadyExistsException(new Slug(album.name));
			}
		}
		const artistSlug =
			album.artist == undefined
				? compilationAlbumArtistKeyword
				: (await this.artistServce.get(album.artist)).slug;
		const albumNameSlug = new Slug(album.name).toString();
		return this.prismaService.album
			.create({
				data: {
					name: album.name,
					artist: album.artist
						? {
								connect: ArtistService.formatWhereInput(
									album.artist,
								),
						  }
						: undefined,
					slug: new Slug(artistSlug, albumNameSlug).toString(),
					nameSlug: albumNameSlug,
					releaseDate: album.releaseDate,
					registeredAt: album.registeredAt,
					type: this.parserService.getAlbumType(album.name),
				},
			})
			.then((created) => {
				this.meiliSearch.index(this.indexName).addDocuments([
					{
						id: created.id,
						slug: created.slug,
						nameSlug: created.nameSlug,
						name: created.name,
						type: created.type,
					},
				]);
				this.eventService.publishItemCreationEvent(
					"album",
					created.name,
					created.id,
					created.type == AlbumType.StudioRecording
						? ResourceEventPriority.StudioAlbum
						: ResourceEventPriority.NonStudioAlbum,
				);
				return created;
			})
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const albumSlug = new Slug(album.name);

					if (album.artist) {
						await this.artistServce.get(album.artist);
					}
					if (error.code == PrismaError.UniqueConstraintViolation) {
						throw new AlbumAlreadyExistsException(
							albumSlug,
							album.artist?.slug ?? album.artist?.id,
						);
					}
				}
				throw new UnhandledORMErrorException(error, album);
			});
	}

	async get<I extends AlbumQueryParameters.RelationInclude = {}>(
		where: AlbumQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: AlbumService.formatWhereInput(where),
		};
		const album = await this.prismaService.album
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.AlbumFindFirstOrThrowArgs
				>
			>(args)
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
		return album;
	}

	/**
	 * Find an album
	 */
	static formatWhereInput(where: AlbumQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.slug?.toString(),
		};
	}

	async search<I extends AlbumQueryParameters.RelationInclude = {}>(
		token: string,
		where: AlbumQueryParameters.ManyWhereInput,
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

	async getMany<I extends AlbumQueryParameters.RelationInclude = {}>(
		where: AlbumQueryParameters.ManyWhereInput,
		sort?: AlbumQueryParameters.SortingParameter | number,
		pagination?: PaginationParameters,
		include?: I,
	): Promise<AlbumModel[]> {
		if (typeof sort == "number") {
			const randomIds = await this.getManyRandomIds(
				where,
				sort,
				pagination,
			);
			return this.getMany(
				{ ...where, id: { in: randomIds } },
				undefined,
				undefined,
				include,
			).then((items) => sortItemsUsingOrderedIdList(randomIds, items));
		}
		const args = {
			include: include ?? ({} as I),
			where: AlbumService.formatManyWhereInput(where),
			orderBy:
				sort === undefined ? undefined : this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		const albums = await this.prismaService.album.findMany<
			Prisma.SelectSubset<typeof args, Prisma.AlbumFindManyArgs>
		>(args);
		return albums;
	}

	private async getManyRandomIds(
		where: AlbumQueryParameters.ManyWhereInput,
		shuffleSeed: number,
		pagination?: PaginationParameters,
	) {
		const ids = await this.prismaService.album
			.findMany({
				where: this.formatManyWhereInput(where),
				select: { id: true },
				orderBy: { id: "asc" },
				cursor: pagination?.afterId
					? { id: pagination.afterId }
					: undefined,
			})
			.then((items) => items.map(({ id }) => id));
		return shuffle(shuffleSeed, ids).slice(
			pagination?.skip ?? 0,
			pagination?.take,
		);
	}

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

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	formatSortingInput(
		sortingParameter: AlbumQueryParameters.SortingParameter,
	): Prisma.AlbumOrderByWithRelationInput {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return { nameSlug: sortingParameter.order };
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

	async update(
		what: AlbumQueryParameters.UpdateInput,
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.prismaService.album
			.update({
				data: {
					...what,
					releaseDate: what.releaseDate ?? undefined,
					genres: what.genres
						? {
								connectOrCreate: what.genres
									.map((genre) => [
										genre,
										new Slug(genre).toString(),
									])
									.map(([genreName, genreSlug]) => ({
										where: { slug: genreSlug },
										create: {
											name: genreName,
											slug: genreSlug,
										},
									})),
						  }
						: undefined,
				},
				where: AlbumService.formatWhereInput(where),
			})
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	async updateAlbumDate(where: AlbumQueryParameters.WhereInput) {
		const album = await this.get(where, { releases: true });

		// If the album's release date has been updated by the matcher
		// We ignore
		// Usually, a date that has a month and a day is provided by the matcher (the scanner only gives years)
		// I know it's ugly
		if (
			album.releaseDate?.getMonth() ||
			(album.releaseDate?.getDate() ?? 1) > 1
		) {
			return;
		}
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
	async delete(where: AlbumQueryParameters.DeleteInput): Promise<AlbumModel> {
		try {
			const album = await this.prismaService.album.delete({
				where: AlbumService.formatWhereInput(where),
			});

			this.meiliSearch.index(this.indexName).deleteDocument(album.id);
			this.logger.warn(`Album '${album.slug}' deleted`);
			return album;
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code == PrismaError.ForeignConstraintViolation
			) {
				throw new AlbumNotEmptyException(where.id);
			}
			throw await this.onNotFound(error, where);
		}
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
		await this.resolveMasterReleases();
	}

	async resolveMasterReleases() {
		const albumsWithoutMasters = await this.prismaService.album.findMany({
			where: { masterId: null },
			include: {
				releases: {
					take: 1,
					orderBy: { releaseDate: { nulls: "last", sort: "asc" } },
				},
			},
		});
		await this.prismaService.$transaction(
			albumsWithoutMasters
				.map((album) => {
					const newMasterRelease = album.releases.at(0);
					if (newMasterRelease) {
						return this.prismaService.album.update({
							where: { id: album.id },
							data: { masterId: newMasterRelease.id },
						});
					}
					return null;
				})
				.filter((q) => q !== null)
				.map((q) => q!),
		);
	}

	/**
	 * Set the release as album's master
	 * @param releaseWhere the query parameters of the release
	 * @returns the updated album
	 */
	async setMasterRelease(releaseWhere: ReleaseQueryParameters.WhereInput) {
		const release = await this.releaseService.get(releaseWhere);

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

	async onNotFound(error: Error, where: AlbumQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			return new AlbumNotFoundException(where.id ?? where.slug);
		}
		return new UnhandledORMErrorException(error, where);
	}
}
