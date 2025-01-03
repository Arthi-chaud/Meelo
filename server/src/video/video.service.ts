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
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import {
	formatPaginationParameters,
	sortItemsUsingOrderedIdList,
} from "src/repository/repository.utils";
import SongService from "src/song/song.service";
import { Prisma, Track, VideoType } from "@prisma/client";
import { shuffle } from "src/utils/shuffle";
import VideoQueryParameters from "./models/video.query-parameters";
import ArtistService from "src/artist/artist.service";
import ParserService from "src/parser/parser.service";
import Slug from "src/slug/slug";
import { PrismaError } from "prisma-error-enum";
import {
	VideoAlreadyExistsException,
	VideoNotFoundException,
} from "./video.exceptions";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { Artist, Video } from "src/prisma/models";
import deepmerge from "deepmerge";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import AlbumService from "src/album/album.service";
import LibraryService from "src/library/library.service";

@Injectable()
export default class VideoService {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
	) {}

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
				//TODO Meilisearch
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
			include: {
				...(include ?? ({} as I)),

				song: include?.artist
					? { include: { featuring: include.artist } }
					: include?.song ?? false,
			},
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
			})
			.then((video) => {
				return {
					...video,
					featuring:
						"song" in (video ?? {}) &&
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						"featuring" in (video.song ?? {})
							? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
							  // @ts-ignore
							  video.song?.featuring ?? []
							: undefined,
				};
			});
	}

	async update(
		what: VideoQueryParameters.UpdateInput,
		where: VideoQueryParameters.WhereInput,
	) {
		return this.prismaService.video
			.update({
				where: VideoService.formatWhereInput(where),
				data: {
					type: what.type,
					song: what.song
						? { connect: SongService.formatWhereInput(what.song) }
						: undefined,
				},
			})

			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
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

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.name) {
			query = deepmerge(query, {
				name: buildStringSearchParameters(where.name),
			});
		}
		if (where.album) {
			query = deepmerge(query, {
				tracks: {
					some: {
						release: {
							album: AlbumService.formatWhereInput(where.album),
						},
					},
				},
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
		return deepmerge(query, {
			AND: {
				tracks: {
					some: {},
				},
			},
		});
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
	async getMany<
		I extends Omit<VideoQueryParameters.RelationInclude, "tracks">,
	>(
		where: VideoQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: VideoQueryParameters.SortingParameter | number,
	): Promise<(Video & { track: Track; featuring?: Artist[] })[]> {
		if (typeof sort == "number") {
			const randomIds = await this.getManyRandomIds(
				where,
				sort,
				pagination,
			);
			return this.getMany(
				{ ...where, id: { in: randomIds } },
				undefined,
				include,
			).then((items) => sortItemsUsingOrderedIdList(randomIds, items));
		}
		return this.prismaService.video
			.findMany({
				orderBy: sort?.sortBy
					? this.formatSortingInput(sort)
					: undefined,
				include: {
					...include,
					song: include?.artist
						? { include: { featuring: include.artist } }
						: include?.song ?? false,
					tracks: {
						where: {
							type: "Video",
						},
						orderBy: { bitrate: { sort: "desc", nulls: "last" } },
						take: 1,
						include: { illustration: true },
					},
				},
				...formatPaginationParameters(pagination),
				where: VideoService.formatManyWhereInput(where),
			})
			.then((videos) =>
				videos.map(({ tracks, ...video }) => ({
					...video,
					song:
						include?.song && video.song
							? { ...video.song, featuring: undefined }
							: include?.song
							? null
							: undefined,
					featuring:
						"featuring" in (video.song ?? {})
							? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
							  // @ts-ignore
							  video.song?.featuring ?? []
							: undefined,
					track: tracks[0],
				})),
			);
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

	async delete(where: VideoQueryParameters.WhereInput) {
		await this.get(where);
		await this.prismaService.video.delete({
			where: VideoService.formatWhereInput(where),
		});
		//TODO Delete in meilisearch
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

		await Promise.all(emptyVideos.map(({ id }) => this.delete({ id })));
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
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				throw new VideoNotFoundException(where.id);
			}
			throw new VideoNotFoundException(where.slug);
		}
		throw new UnhandledORMErrorException(error, where);
	}
}
