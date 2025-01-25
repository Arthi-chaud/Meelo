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
import { AlbumType, Prisma, VideoType } from "@prisma/client";
import deepmerge from "deepmerge";
import type MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import LibraryService from "src/library/library.service";
import Logger from "src/logger/logger";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import ParserService from "src/parser/parser.service";
import type { VideoWithRelations } from "src/prisma/models";
import type PrismaService from "src/prisma/prisma.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
	sortItemsUsingOrderedIdList,
} from "src/repository/repository.utils";
import SearchableRepositoryService from "src/repository/searchable-repository.service";
import Slug from "src/slug/slug";
import SongService from "src/song/song.service";
import TrackService from "src/track/track.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import { shuffle } from "src/utils/shuffle";
import type VideoQueryParameters from "./models/video.query-parameters";
import {
	VideoAlreadyExistsException,
	VideoNotFoundException,
} from "./video.exceptions";

@Injectable()
export default class VideoService extends SearchableRepositoryService {
	private readonly logger = new Logger(VideoService.name);
	constructor(
		@InjectMeiliSearch() protected readonly meiliSearch: MeiliSearch,
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
	) {
		super("videos", ["name", "slug", "nameSlug", "type"], meiliSearch);
	}

	async create<I extends VideoQueryParameters.RelationInclude = {}>(
		data: VideoQueryParameters.CreateInput,
		include?: I,
	) {
		const artist = await this.artistService.get(data.artist);
		const args = {
			include: include ?? ({} as I),
			data: {
				name: data.name,
				registeredAt: data.registeredAt,
				slug: new Slug(artist.name, data.name).toString(),
				nameSlug: new Slug(data.name).toString(),
				type: data.type ?? this.parserService.getVideoType(data.name),
				artist: {
					connect: ArtistService.formatWhereInput(data.artist),
				},
				group: {
					connectOrCreate: data.group
						? {
								create: SongService.formatSongGroupCreateInput(
									data.group,
								),
								where: SongService.formatSongGroupWhereInput(
									data.group,
								),
							}
						: undefined,
				},
				song: data.song
					? {
							connect: SongService.formatWhereInput(data.song),
						}
					: undefined,
			},
		};
		return this.prismaService.video
			.create<Prisma.SelectSubset<typeof args, Prisma.VideoCreateArgs>>(
				args,
			)
			.then((res) => {
				this.meiliSearch.index(this.indexName).addDocuments([
					{
						id: res.id,
						nameSlug: res.nameSlug,
						slug: res.slug,
						name: res.name,
					},
				]);
				return res;
			})
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (data.song) {
						await this.songService.get(data.song);
					}

					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new VideoAlreadyExistsException(
							data.name,
							artist.name,
						);
					}
				}
				throw new UnhandledORMErrorException(error, data);
			});
	}

	async get<I extends VideoQueryParameters.RelationInclude = {}>(
		where: VideoQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: VideoService.formatWhereInput(where),
		};
		return this.prismaService.video
			.findUniqueOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.VideoFindUniqueOrThrowArgs
				>
			>(args)
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
	}

	async search<I extends VideoQueryParameters.RelationInclude = {}>(
		token: string,
		where: VideoQueryParameters.ManyWhereInput,
		pagination: PaginationParameters = {},
		include?: I,
	) {
		const matchingIds = await this.getMatchingIds(token, pagination);
		const artists = await this.getMany(
			{ ...where, videos: matchingIds.map((id) => ({ id })) },
			{},
			include,
			{},
		);

		return this.sortItemsUsingMatchList(matchingIds, artists);
	}

	async update(
		what: VideoQueryParameters.UpdateInput,
		where: VideoQueryParameters.WhereInput,
	) {
		if (what.master) {
			const newMaster = await this.trackService.get(what.master);
			const video = await this.get(where);
			if (newMaster.videoId !== video.id) {
				throw new InvalidRequestException(
					"Master track of video should be track of said video",
				);
			}
		}
		let updatedVideo = await this.prismaService.video
			.update({
				where: VideoService.formatWhereInput(where),
				data: {
					type: what.type,
					master:
						what.master === null
							? { disconnect: true }
							: what.master
								? {
										connect: TrackService.formatWhereInput(
											what.master,
										),
									}
								: undefined,
					song: what.song
						? { connect: SongService.formatWhereInput(what.song) }
						: undefined,
				},
			})
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
		// If the video becomes an extra
		// Unlink related song but patch group id
		if (
			VideoService.videoTypeIsExtra(updatedVideo.type) &&
			updatedVideo.songId
		) {
			const linkedSong = await this.songService.get({
				id: updatedVideo.songId,
			});
			updatedVideo = await this.prismaService.video.update({
				where: { id: updatedVideo.id },
				data: {
					groupId: linkedSong.groupId,
					songId: null,
					tracks: {
						updateMany: {
							where: { videoId: updatedVideo.id },
							data: { songId: null },
						},
					},
				},
			});
			await this.songService.housekeeping();
		}
		// If instead we make an extra into a song
		// TODO It's uuglyyy
		else if (
			!updatedVideo.songId &&
			!VideoService.videoTypeIsExtra(updatedVideo.type)
		) {
			const artist = await this.artistService.get({
				id: updatedVideo.artistId,
			});
			const songName = this.parserService.parseTrackExtensions(
				updatedVideo.name,
			).parsedName;
			const newSong = await this.songService.getOrCreate({
				name: songName,
				artist: { id: updatedVideo.artistId },
				registeredAt: updatedVideo.registeredAt,
				genres: [],
				group: {
					slug: new Slug(
						artist.name,
						this.parserService.stripGroups(songName) || songName,
					),
				},
			});
			updatedVideo = await this.prismaService.video.update({
				where: { id: updatedVideo.id },
				data: {
					groupId: newSong.groupId,
					songId: newSong.id,
					tracks: {
						updateMany: {
							where: { videoId: updatedVideo.id },
							data: { songId: newSong.id },
						},
					},
				},
			});
			await this.songService.housekeeping();
		}
		return updatedVideo;
	}

	static formatWhereInput(
		where: VideoQueryParameters.WhereInput,
	): Prisma.VideoWhereUniqueInput {
		return {
			id: where.id,
			slug: where.slug?.toString(),
		};
	}

	static videoTypeIsExtra(vType: VideoType): boolean {
		const nonExtraTypes: VideoType[] = [
			VideoType.MusicVideo,
			VideoType.LyricsVideo,
			VideoType.Live,
		];
		return !nonExtraTypes.includes(vType);
	}

	static formatManyWhereInput(
		where: VideoQueryParameters.ManyWhereInput,
	): Prisma.VideoWhereInput {
		let query: Prisma.VideoWhereInput = {
			type: where.type,
		};

		if (where.videos) {
			query = deepmerge(query, {
				OR: where.videos.map((videoIdentifier) =>
					VideoService.formatWhereInput(videoIdentifier),
				),
			});
		}
		if (where.name) {
			query = deepmerge(query, {
				name: buildStringSearchParameters(where.name),
			});
		}
		if (where.album) {
			query = deepmerge(query, {
				OR: [
					{
						// Video tracks from singles that are extras
						// applicable only if album is studio recording
						tracks: {
							some: {
								release: {
									album: { type: AlbumType.Single },
									tracks: {
										some: {
											song: {
												tracks: {
													some: {
														release: {
															album: {
																...AlbumService.formatWhereInput(
																	where.album,
																),
																type: AlbumType.StudioRecording,
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
					{
						song: {
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

					{
						group: {
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
					{
						tracks: {
							some: {
								OR: [
									{
										video: {
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
									{
										song: {
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
								],
							},
						},
					},
				],
			});
		}

		if (where.library) {
			query = deepmerge(query, {
				tracks: {
					some: {
						sourceFile: {
							library: LibraryService.formatWhereInput(
								where.library,
							),
						},
					},
				},
			});
		}

		if (where.song) {
			query = deepmerge(query, {
				song: SongService.formatWhereInput(where.song),
			});
		}

		if (where.group) {
			query = deepmerge(query, {
				OR: [
					{
						song: {
							group: SongService.formatSongGroupWhereInput(
								where.group,
							),
						},
					},

					{
						group: SongService.formatSongGroupWhereInput(
							where.group,
						),
					},
				],
			});
		}

		if (where.artist) {
			query = deepmerge(query, {
				OR: [
					{
						artist: ArtistService.formatWhereInput(where.artist),
					},

					{
						song: {
							featuring: {
								some: ArtistService.formatWhereInput(
									where.artist,
								),
							},
						},
					},
				],
			});
		}
		return query;
	}

	private async getManyRandomIds(
		where: VideoQueryParameters.ManyWhereInput,
		shuffleSeed: number,
		pagination?: PaginationParameters,
	) {
		const ids = await this.prismaService.video
			.findMany({
				where: VideoService.formatManyWhereInput(where),
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

	/**
	 * Get videos with at least one track
	 * The videos are returned with their first video track
	 * @param where the query parameters to find the video
	 * @param pagination the pagination parameters
	 * @param include the relations to include with the returned videos
	 */
	async getMany<I extends VideoQueryParameters.RelationInclude>(
		where: VideoQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: VideoQueryParameters.SortingParameter | number,
	): Promise<VideoWithRelations[]> {
		if (typeof sort === "number") {
			const randomIds = await this.getManyRandomIds(
				where,
				sort,
				pagination,
			);
			return this.getMany(
				{ ...where, videos: randomIds.map((id) => ({ id })) },
				undefined,
				include,
			).then((items) => sortItemsUsingOrderedIdList(randomIds, items));
		}
		return this.prismaService.video.findMany({
			orderBy: sort?.sortBy ? this.formatSortingInput(sort) : undefined,
			include: include,
			...formatPaginationParameters(pagination),
			where: VideoService.formatManyWhereInput(where),
		});
	}

	formatSortingInput(
		sortingParameter: VideoQueryParameters.SortingParameter,
	) {
		sortingParameter.order ??= "asc";
		const sort: Prisma.VideoOrderByWithRelationInput[] = [];
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
			default:
				sort.push({
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				});
		}
		return sort;
	}

	async delete(where: VideoQueryParameters.WhereInput[]) {
		const toDelete = await this.getMany({ videos: where });
		const deleted = await this.prismaService.video.deleteMany({
			where: VideoService.formatManyWhereInput({ videos: where }),
		});

		this.meiliSearch
			.index(this.indexName)
			.deleteDocuments(toDelete.map((video) => video.id));
		return deleted.count;
	}

	/**
	 * Call 'delete' on all videos that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptyVideos = await this.prismaService.video.findMany({
			select: {
				id: true,
			},
			where: {
				tracks: {
					none: {},
				},
			},
		});
		const deletedVideoCount = await this.delete(
			emptyVideos.map(({ id }) => ({ id })),
		);
		if (deletedVideoCount) {
			this.logger.warn(`Deleted ${deletedVideoCount} videos`);
		}
	}

	async getOrCreate<I extends VideoQueryParameters.RelationInclude = {}>(
		input: VideoQueryParameters.CreateInput,
		include?: I,
	) {
		try {
			const artist = await this.artistService.get(input.artist);
			return await this.get(
				{
					slug: new Slug(artist.name, input.name),
				},
				include,
			);
		} catch {
			return this.create(input, include);
		}
	}

	async onNotFound(error: Error, where: VideoQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				throw new VideoNotFoundException(where.id);
			}
			throw new VideoNotFoundException(where.slug);
		}
		throw new UnhandledORMErrorException(error, where);
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;
}
