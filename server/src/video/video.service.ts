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
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import {
	formatPaginationParameters,
	sortItemsUsingOrderedIdList,
} from "src/repository/repository.utils";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import { Prisma, Song, Track } from "@prisma/client";
import { shuffle } from "src/utils/shuffle";

@Injectable()
export default class VideoService {
	constructor(
		private prismaService: PrismaService,
		private songService: SongService,
	) {}

	static formatManyWhereInput(
		where: SongQueryParameters.ManyWhereInput,
	): Prisma.SongWhereInput {
		return {
			OR: [
				SongService.formatManyWhereInput(where),
				{
					group: {
						versions: {
							some: SongService.formatManyWhereInput(where),
						},
					},
				},
			],
			AND: {
				tracks: {
					some: {
						type: "Video",
					},
				},
			},
		};
	}

	private async getManyRandomIds(
		where: SongQueryParameters.ManyWhereInput,
		shuffleSeed: number,
		pagination?: PaginationParameters,
	) {
		const ids = await this.prismaService.song
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
	 * Get songs with at least one video track
	 * The songs are returned with its first video track
	 * @param where the query parameters to find the songs
	 * @param pagination the pagination parameters
	 * @param include the relations to include with the returned songs
	 */
	async getMany<
		I extends Omit<SongQueryParameters.RelationInclude, "tracks">,
	>(
		where: SongQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter | number,
	): Promise<(Song & { track: Track })[]> {
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
		return this.prismaService.song
			.findMany({
				orderBy: sort?.sortBy
					? this.songService.formatSortingInput(sort)
					: where.album
					? [
							{
								master: {
									discIndex: {
										sort: "asc",
										nulls: "last",
									} as const,
								},
							},
							{
								master: {
									trackIndex: {
										sort: "asc",
										nulls: "last",
									} as const,
								},
							},
					  ]
					: undefined,
				include: {
					...include,
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
			.then((songs) =>
				songs.map(({ tracks, ...song }) => ({
					...song,
					track: tracks[0],
				})),
			);
	}
}
