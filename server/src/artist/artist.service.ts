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
import { Prisma } from "@prisma/client";
import type MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import {
	EventsService,
	ResourceEventPriority,
} from "src/events/events.service";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { filterToPrisma } from "src/filter/filter";
import GenreService from "src/genre/genre.service";
import type Identifier from "src/identifier/models/identifier";
import IllustrationRepository from "src/illustration/illustration.repository";
import Logger from "src/logger/logger";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import SearchableRepositoryService from "src/repository/searchable-repository.service";
import Slug from "src/slug/slug";
import { getSortName } from "src/sort/sort-name";
import TrackService from "src/track/track.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import {
	ArtistNotEmptyException,
	ArtistNotFoundException,
	CompilationArtistException,
} from "./artist.exceptions";
import type ArtistQueryParameters from "./models/artist.query-parameters";

@Injectable()
export default class ArtistService extends SearchableRepositoryService {
	private readonly logger = new Logger(ArtistService.name);
	constructor(
		@InjectMeiliSearch() protected readonly meiliSearch: MeiliSearch,
		private prismaService: PrismaService,
		private illustrationRepository: IllustrationRepository,
		private eventService: EventsService,
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
			{ ...where, artists: matchingIds.map((id) => ({ id })) },
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
		const artists =
			await this.prismaService.artist.findMany<
				Prisma.SelectSubset<typeof args, Prisma.ArtistFindManyArgs>
			>(args);
		return artists;
	}

	async create(input: ArtistQueryParameters.CreateInput) {
		const artistSlug = new Slug(input.name);
		const artistSortName = input.sortName ?? getSortName(input.name);
		return this.prismaService.artist
			.create({
				data: {
					name: input.name,
					sortName: artistSortName,
					sortSlug: new Slug(artistSortName).toString(),
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
				this.eventService.publishItemCreationEvent(
					"artist",
					artist.name,
					artist.id,
					ResourceEventPriority.Artist,
				);
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
			error.code === PrismaError.RecordsNotFound
		) {
			return new ArtistNotFoundException(where.id ?? where.slug!);
		}
		return new UnhandledORMErrorException(error, where);
	}

	/**
	 * Get Artists
	 */
	static formatManyWhereInput(where: ArtistQueryParameters.ManyWhereInput) {
		const query: Prisma.ArtistWhereInput[] = [
			{
				name: buildStringSearchParameters(where.name),
			},
		];

		if (where.artists) {
			query.push({
				OR: where.artists.map((artist) =>
					ArtistService.formatWhereInput(artist),
				),
			});
		}
		if (where.library?.and) {
			query.push({
				AND: where.library.and.map((l) => ({
					OR: [
						{
							albums: {
								some: {
									releases: {
										some: ReleaseService.formatManyWhereInput(
											{
												library: { is: l },
											},
										),
									},
								},
							},
						},
						{
							songs: {
								some: {
									tracks: {
										some: {
											song: {
												tracks: {
													some: TrackService.formatManyWhereInput(
														{ library: { is: l } },
													),
												},
											},
										},
									},
								},
							},
						},
					],
				})),
			});
		} else if (where.library) {
			query.push({
				OR: [
					{
						albums: {
							some: {
								releases: {
									some: ReleaseService.formatManyWhereInput({
										library: where.library,
									}),
								},
							},
						},
					},
					{
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
					},
				],
			});
		}
		if (where.genre) {
			query.push({
				songs: {
					some: {
						genres: {
							some: filterToPrisma(
								where.genre,
								GenreService.formatWhereInput,
							),
						},
					},
				},
			});
		}
		if (where.label) {
			query.push({
				AND: [
					{
						albums: {
							some: AlbumService.formatManyWhereInput({
								label: where.label,
							}),
						},
					},
				],
			});
		}
		if (where.album?.and) {
			query.push({
				AND: where.album.and.map((a) => ({
					OR: [
						{
							songs: {
								some: {
									tracks: {
										some: {
											release: {
												album: AlbumService.formatWhereInput(
													a,
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
													a,
												),
											},
										},
									},
								},
							},
						},
					],
				})),
			});
		} else if (where.album) {
			query.push({
				OR: [
					{
						songs: {
							some: {
								tracks: {
									some: {
										release: {
											album: filterToPrisma(
												where.album,
												AlbumService.formatWhereInput,
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
											album: filterToPrisma(
												where.album,
												AlbumService.formatWhereInput,
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
		if (where.primaryArtistsOnly) {
			query.push({
				OR: [
					{
						NOT: { albums: { none: {} } },
					},
					{
						videos: {
							some: { tracks: { some: { releaseId: null } } },
						},
					},
					{
						songs: {
							some: { tracks: { some: { releaseId: null } } },
						},
					},
				],
			});
		}

		return { AND: query };
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): ArtistQueryParameters.WhereInput {
		return formatIdentifier(identifier, (stringIdentifier) => {
			if (stringIdentifier.toString() === compilationAlbumArtistKeyword) {
				return { compilationArtist: true };
			}
			return { slug: new Slug(stringIdentifier) };
		});
	}

	formatSortingInput(
		sortingParameter: ArtistQueryParameters.SortingParameter,
	): Prisma.ArtistOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ sortSlug: sortingParameter.order }, { id: "asc" }];
			case "albumCount":
				return [
					{ albums: { _count: sortingParameter.order } },
					{ slug: "asc" },
				];
			case "songCount":
				return [
					{ songs: { _count: sortingParameter.order } },
					{ slug: "asc" },
				];
			case "addDate":
				return [
					{ registeredAt: sortingParameter.order },
					{ id: sortingParameter.order },
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

	async delete(where: ArtistQueryParameters.DeleteInput[]) {
		if (!where.length) {
			return 0;
		}
		const artists = await this.getMany(
			{ artists: where },
			undefined,
			undefined,
			{ songs: true, featuredOn: true, videos: true, albums: true },
		);

		for (const artist of artists) {
			if (
				artist.songs.length ||
				artist.featuredOn.length ||
				artist.videos.length ||
				artist.albums.length
			) {
				throw new ArtistNotEmptyException(artist.id);
			}
		}
		await Promise.allSettled(
			artists
				.filter(({ illustrationId }) => illustrationId !== null)
				.map(({ illustrationId }) =>
					this.illustrationRepository.deleteIllustration(
						illustrationId!,
					),
				),
		);
		const deletedArtist = await this.prismaService.artist
			.deleteMany({
				where: ArtistService.formatManyWhereInput({ artists: where }),
			})
			.catch((error) => {
				throw new UnhandledORMErrorException(error, where);
			});
		this.meiliSearch
			.index(this.indexName)
			.deleteDocuments(artists.map(({ id }) => id));
		return deletedArtist.count;
	}

	/**
	 * Call 'delete' method on all artist that do not have any songs or albums
	 */
	async housekeeping(): Promise<void> {
		const emptyArtists = await this.prismaService.artist.findMany({
			select: {
				id: true,
			},
			where: {
				albums: { none: {} },
				songs: { none: {} },
				featuredOn: { none: {} },
				videos: { none: {} },
			},
		});
		const deletedArtistCount =
			emptyArtists.length > 0
				? await this.delete(
						emptyArtists.map((artist) => ({ id: artist.id })),
					)
				: 0;
		if (deletedArtistCount) {
			this.logger.warn(`Deleted ${deletedArtistCount} artists`);
		}
	}
}
