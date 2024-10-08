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
import { AlbumType, Prisma, SongType, TrackType } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import SongQueryParameters from "./models/song.query-params";
import TrackService from "src/track/track.service";
import GenreService from "src/genre/genre.service";
import { CompilationArtistException } from "src/artist/artist.exceptions";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Song, SongWithRelations } from "src/prisma/models";
import Logger from "src/logger/logger";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import { PrismaError } from "prisma-error-enum";
import {
	SongAlreadyExistsException,
	SongNotEmptyException,
	SongNotFoundException,
} from "./song.exceptions";
import AlbumService from "src/album/album.service";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import ParserService from "src/scanner/parser.service";
import deepmerge from "deepmerge";
import MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import SortingOrder from "src/sort/models/sorting-order";
import SongGroupQueryParameters from "./models/song-group.query-params";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import SearchableRepositoryService from "src/repository/searchable-repository.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
	sortItemsUsingOrderedIdList,
} from "src/repository/repository.utils";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { shuffle } from "src/utils/shuffle";

@Injectable()
export default class SongService extends SearchableRepositoryService {
	private readonly logger = new Logger(SongService.name);
	constructor(
		@InjectMeiliSearch() protected readonly meiliSearch: MeiliSearch,
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
	) {
		super(
			"songs",
			["name", "slug", "nameSlug", "lyrics", "type"],
			meiliSearch,
		);
	}

	getTableName() {
		return "songs";
	}

	/**
	 * Create
	 */
	async create<I extends SongQueryParameters.RelationInclude = {}>(
		song: SongQueryParameters.CreateInput,
		include?: I,
	) {
		await Promise.all(
			song.genres.map((genre) => this.genreService.get(genre)),
		);
		const artist = await this.artistService.get(song.artist);
		const songNameSlug = new Slug(song.name).toString();
		const songUniqueSlug = this._createSongUniqueSlug(
			artist.slug,
			songNameSlug,
			song.featuring,
		).toString();
		const args = {
			data: {
				slug: songUniqueSlug,
				nameSlug: songNameSlug,
				genres: {
					connect: song.genres.map((genre) =>
						GenreService.formatWhereInput(genre),
					),
				},
				group: {
					connectOrCreate: {
						create: SongService.formatSongGroupCreateInput(
							song.group,
						),
						where: SongService.formatSongGroupWhereInput(
							song.group,
						),
					},
				},
				artist: {
					connect: ArtistService.formatWhereInput(song.artist),
				},
				featuring: song.featuring
					? {
							connect: song.featuring.map(
								ArtistService.formatWhereInput,
							),
					  }
					: undefined,
				registeredAt: song.registeredAt,
				type: this.parserService.getSongType(song.name),
				name: song.name,
			},
			include: include ?? ({} as I),
		};
		return this.prismaService.song
			.create<Prisma.Subset<typeof args, Prisma.SongCreateArgs>>(args)
			.then((created) => {
				this.meiliSearch.index(this.indexName).addDocuments([
					{
						id: created.id,
						nameSlug: created.nameSlug,
						slug: created.slug,
						name: created.name,
						type: created.type,
					},
				]);
				return created;
			})
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new SongAlreadyExistsException(
							new Slug(song.name),
							new Slug(artist.name),
						);
					}
				}
				throw new UnhandledORMErrorException(error, song);
			});
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: SongQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.slug?.toString(),
		};
	}

	async get<I extends SongQueryParameters.RelationInclude = {}>(
		where: SongQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			where: SongService.formatWhereInput(where),
			include: include ?? ({} as I),
		};
		return this.prismaService.song
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.SongFindFirstOrThrowArgs
				>
			>(args)
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
	}

	async getOrCreate<I extends SongQueryParameters.RelationInclude = {}>(
		input: SongQueryParameters.CreateInput,
		include?: I,
	) {
		try {
			const artist = await this.artistService.get(input.artist);
			return await this.get(
				{
					slug: this._createSongUniqueSlug(
						artist.name,
						input.name,
						input.featuring,
					),
				},
				include,
			);
		} catch {
			return this.create(input, include);
		}
	}

	async search<I extends SongQueryParameters.RelationInclude = {}>(
		token: string,
		where: SongQueryParameters.ManyWhereInput,
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

	async getMany<I extends SongQueryParameters.RelationInclude = {}>(
		where: SongQueryParameters.ManyWhereInput,
		sort?: SongQueryParameters.SortingParameter | number,
		pagination?: PaginationParameters,
		include?: I,
	): Promise<SongWithRelations[]> {
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
			where: SongService.formatManyWhereInput(where),
			orderBy:
				sort == undefined ? undefined : this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		return this.prismaService.song.findMany<
			Prisma.SelectSubset<typeof args, Prisma.SongFindManyArgs>
		>(args);
	}

	private async getManyRandomIds(
		where: SongQueryParameters.ManyWhereInput,
		shuffleSeed: number,
		pagination?: PaginationParameters,
	) {
		const ids = await this.prismaService.song
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

	static formatManyWhereInput(where: SongQueryParameters.ManyWhereInput) {
		if (where.artist?.compilationArtist) {
			throw new CompilationArtistException("Song");
		}
		let query: Prisma.SongWhereInput = {
			artistId: where.artist?.id,
			name: buildStringSearchParameters(where.name),
			type: where.type,
		};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.genre) {
			query = deepmerge(query, {
				genres: {
					some: GenreService.formatWhereInput(where.genre),
				},
			});
		}
		if (where.artist?.slug) {
			query = deepmerge(query, {
				OR: [
					{
						artist: {
							slug: where.artist.slug.toString(),
						},
					},
					{
						featuring: {
							some: { slug: where.artist.slug.toString() },
						},
					},
				],
			});
		}
		if (where.library) {
			query = deepmerge(query, {
				tracks: {
					some: TrackService.formatManyWhereInput({
						library: where.library,
					}),
				},
			});
		}
		if (where.album) {
			query = deepmerge(query, {
				tracks: {
					some: TrackService.formatManyWhereInput({
						album: where.album,
					}),
				},
			});
		}
		if (where.group) {
			query = deepmerge(query, {
				group: SongService.formatSongGroupWhereInput(where.group),
			} satisfies Prisma.SongWhereInput);
		}
		if (where.versionsOf) {
			query = deepmerge(query, {
				group: {
					versions: {
						some: SongService.formatWhereInput(where.versionsOf),
					},
				},
			} satisfies Prisma.SongWhereInput);
		}
		return query;
	}

	formatManyWhereInput = SongService.formatManyWhereInput;

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	formatSortingInput(sortingParameter: SongQueryParameters.SortingParameter) {
		sortingParameter.order ??= "asc";
		const sort: Prisma.SongOrderByWithRelationInput[] = [];
		switch (sortingParameter.sortBy) {
			case "name":
				sort.push({ nameSlug: sortingParameter.order });
				break;
			case "addDate":
				sort.push({ registeredAt: sortingParameter.order });
				break;
			case "artistName":
				sort.push({
					artist: this.artistService.formatSortingInput({
						sortBy: "name",
						order: sortingParameter.order,
					}),
				});
				break;
			case "userPlayCount":
			case "totalPlayCount":
				sort.push({
					playHistory: {
						_count: sortingParameter.order,
					},
				});
				break;
			case "releaseDate":
				sort.push(
					{
						master: {
							release: {
								album: {
									releaseDate: sortingParameter.order,
								},
							},
						},
					},
					{
						master: {
							release: {
								releaseDate: sortingParameter.order,
							},
						},
					},
					{
						name: "asc",
					},
					{
						artist: {
							name: "asc",
						},
					},
				);
				break;
			default:
				sort.push({
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				});
		}
		sort.push({
			featuring: { _count: "asc" as const },
		});
		return sort;
	}

	async onNotFound(error: Error, where: SongQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				throw new SongNotFoundException(where.id);
			}
			throw new SongNotFoundException(where.slug);
		}
		throw new UnhandledORMErrorException(error, where);
	}

	/**
	 * Update
	 */
	formatUpdateInput(
		what: SongQueryParameters.UpdateInput,
	): Prisma.SongUpdateInput {
		return {
			...what,
			genres: what.genres
				? {
						connect: what.genres.map((genre) =>
							GenreService.formatWhereInput(genre),
						),
				  }
				: undefined,
		};
	}

	/**
	 * Updates a song in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the album to update
	 * @returns the updated song
	 */
	async update(
		what: SongQueryParameters.UpdateInput,
		where: SongQueryParameters.WhereInput,
	) {
		if (what.genres) {
			await Promise.all(
				what.genres.map((genreWhere) =>
					this.genreService.get(genreWhere),
				),
			);
		}
		return this.prismaService.song
			.update({
				data: this.formatUpdateInput(what),
				where: SongService.formatWhereInput(where),
			})
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
	}

	/**
	 * Set the track as song's master
	 * @param trackWhere the query parameters of the track
	 * @returns the updated song
	 */
	async setMasterTrack(trackWhere: TrackQueryParameters.WhereInput) {
		const track = await this.trackService.get(trackWhere);

		return this.prismaService.song.update({
			where: { id: track.songId },
			data: { masterId: track.id },
		});
	}

	/**
	 * Unset song's master track
	 * @param song the query parameters of the song
	 * @returns the updated song
	 */
	async unsetMasterTrack(songWhere: SongQueryParameters.WhereInput) {
		return this.prismaService.song.update({
			where: SongService.formatWhereInput(songWhere),
			data: { masterId: null },
		});
	}

	/**
	 * Increment a song's play count
	 * @param where the query parameter to find the song to update
	 * @returns the updated song
	 */
	async incrementPlayCount(
		userId: number,
		where: SongQueryParameters.WhereInput,
	): Promise<void> {
		const song = await this.get(where);
		await this.prismaService.playHistory
			.create({
				data: {
					userId: userId,
					songId: song.id,
				},
			})
			.catch(() => {});
	}

	/**
	 * Deletes a song
	 * @param where Query parameters to find the song to delete
	 */
	async delete(where: SongQueryParameters.DeleteInput): Promise<Song> {
		return this.prismaService.song
			.delete({
				where: SongService.formatWhereInput(where),
			})
			.then((deleted) => {
				this.meiliSearch
					.index(this.indexName)
					.deleteDocument(deleted.id);
				this.logger.warn(`Song '${deleted.slug}' deleted`);
				return deleted;
			})
			.catch(async (error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code == PrismaError.ForeignConstraintViolation
				) {
					throw new SongNotEmptyException(where.id);
				}
				throw await this.onNotFound(error, where);
			});
	}

	/**
	 * Call 'delete' on all songs that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptySongs = await this.prismaService.song
			.findMany({
				select: {
					id: true,
					_count: {
						select: { tracks: true },
					},
				},
			})
			.then((genres) => genres.filter((genre) => !genre._count.tracks));

		await Promise.all(emptySongs.map(({ id }) => this.delete({ id })));
		await this.prismaService.songGroup.deleteMany({
			where: {
				versions: {
					none: {},
				},
			},
		});
		await this.resolveMasterTracks();
	}

	async resolveMasterTracks() {
		const songsWithoutMasters = await this.prismaService.song.findMany({
			where: { masterId: null },
			include: {
				tracks: {
					take: 1,
					orderBy: [{ type: "asc" }, { bitrate: "desc" }],
				},
			},
		});
		await this.prismaService.$transaction(
			songsWithoutMasters
				.map((song) => {
					const newMasterTrack = song.tracks.at(0);
					if (newMasterTrack) {
						return this.prismaService.song.update({
							where: { id: song.id },
							data: { masterId: newMasterTrack.id },
						});
					}
					return null;
				})
				.filter((q) => q !== null)
				.map((q) => q!),
		);
	}

	async getManyByPlayCount<I extends SongQueryParameters.RelationInclude>(
		userId: number,
		where: SongQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		order?: SortingOrder,
	) {
		const playedSongs = await this.prismaService.playHistory.groupBy({
			where: { userId: userId },
			by: ["songId"],
			orderBy: {
				_count: {
					songId: order ?? "desc",
				},
			},
		});
		return this.getMany(
			{
				...where,
				id: { in: playedSongs.map(({ songId }) => songId) },
			},
			undefined,
			pagination,
			include,
		);
	}

	async getReleaseBSides<I extends SongQueryParameters.RelationInclude>(
		where: ReleaseQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter,
	) {
		const { album, ...release } = await this.releaseService.get(where, {
			album: true,
		});

		if (album.type != AlbumType.StudioRecording) {
			return [];
		}
		const albumSongs = await this.getMany(
			{ album: { id: album.id } },
			undefined,
			undefined,
			{ tracks: true },
		);
		const albumSongsBaseNames = albumSongs
			// Some albums have live songs from previous albums, we ignore them
			.filter((song) => song.type != SongType.Live)
			// We remove songs that are present only on video in the release
			.filter(
				(song) =>
					song.tracks!.find(
						(track) =>
							track.type == "Audio" &&
							track.releaseId == release.id,
					) != undefined,
			)
			.map(({ name }) => new Slug(this.getBaseSongName(name)).toString());

		return this.prismaService.song.findMany({
			where: {
				tracks: {
					some: {
						release: {
							album: {
								OR: [
									{
										AND: [
											// Get songs from singles...
											{
												...AlbumService.formatManyWhereInput(
													{
														related: {
															id: release.albumId,
														},
													},
												),
												type: AlbumType.Single,
											},
											//... that are relates to the current tracklist
											{
												OR: [
													...albumSongsBaseNames.map(
														(slug) => ({
															nameSlug: {
																startsWith:
																	slug,
															},
															artistId:
																album.artistId,
															type: AlbumType.Single,
														}),
													),
												],
											},
										],
									},
									// Get tracks songs from other releases of the parent album
									{
										id: release.albumId,
									},
								],
							},
						},
					},
				},
				AND: [
					// Exclude songs that are already on the release
					{
						tracks: {
							none: {
								release: { id: release.id },
							},
						},
					},
					// We only want songs that have at least one audtio tracks
					{ tracks: { some: { type: TrackType.Audio } } },
					{
						OR: [
							// We take original songs or extras
							{
								type: { in: ["Original", "NonMusic"] },
							},
							// Or songs that are only available as demos/acoustic versions
							{
								group: {
									versions: {
										every: {
											type: { in: ["Demo", "Acoustic"] },
										},
									},
								},
							},
						],
					},
				],
			},
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			include: include ?? ({} as I),
			...formatPaginationParameters(pagination),
		});
	}

	async getRareSongsByArtist<I extends SongQueryParameters.RelationInclude>(
		where: ArtistQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter,
	) {
		const artist = await this.artistService
			.get(where, { albums: true })
			.catch(() => null);

		if (!artist || artist.albums.length == 0) {
			// if the artist does not have albums, lets skip this
			return [];
		}
		return this.prismaService.song.findMany({
			where: {
				// Take the tracks that have at least one audio track
				tracks: {
					some: { type: "Audio" },
				},
				AND: [
					{
						OR: [
							{
								type: { in: ["Original"] },
							},
							{
								group: {
									versions: {
										every: {
											type: { in: ["Demo", "Acoustic"] },
										},
									},
								},
							},
						],
					},
					{
						OR: [
							{ artistId: artist.id },
							{ featuring: { some: { id: artist.id } } },
						],
					},
					{
						OR: [
							// Take songs that only appears on other artist's album
							{
								// In that case, we only want song with artist being the main one
								artistId: artist.id,
								tracks: {
									every: {
										release: {
											album: {
												artistId: { not: artist.id },
											},
										},
									},
								},
							},
							// Take all tracks that only appear on non-master albums
							{
								tracks: {
									every: {
										release: {
											album: {
												type: "StudioRecording",
											},
											masterOf: null,
										},
									},
								},
							},
							// Take all tracks that appear only on singles AND non master albums
							{
								tracks: {
									every: {
										OR: [
											{
												release: {
													album: {
														type: "Single",
													},
												},
												trackIndex: {
													notIn: [0, 1],
												},
											},
											{
												release: {
													album: {
														type: "StudioRecording",
													},
													masterOf: null,
												},
											},
										],
									},
								},
							},
							{
								tracks: {
									some: {
										isBonus: true,
									},
								},
							},
						],
					},
				],
			},
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			include: include ?? ({} as I),
			...formatPaginationParameters(pagination),
		});
	}

	/**
	 * Removes all extensions for a song name
	 * An extension is a group of characters in brackets, parenthesis or curly brackets
	 * @param songName the name of the song to strip
	 */
	private getBaseSongName(songName: string): string {
		return this.parserService.stripGroups(songName);
	}

	private static formatSongGroupCreateInput(
		input: SongGroupQueryParameters.CreateInput,
	) {
		return {
			slug: input.slug.toString(),
		};
	}

	private static formatSongGroupWhereInput(
		input: SongGroupQueryParameters.WhereInput,
	) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
			songs: input.song
				? {
						some: SongService.formatWhereInput(input.song),
				  }
				: undefined,
		};
	}

	private _createSongUniqueSlug(
		artistName: string,
		songName: string,
		featuring: SongQueryParameters.CreateInput["featuring"],
	) {
		if (featuring && featuring.length > 0) {
			return new Slug(
				artistName,
				songName,
				"feat",
				...featuring.map((feat) => feat.slug.toString()),
			);
		}
		return new Slug(artistName, songName);
	}
}
