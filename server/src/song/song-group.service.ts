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
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import type { SongWithRelations } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import { formatPaginationParameters } from "src/repository/repository.utils";
import type SongQueryParameters from "./models/song.query-params";
import type SongGroupQueryParameters from "./models/song-group.query-params";
import SongService from "./song.service";

@Injectable()
export default class SongGroupService {
	constructor(private prismaService: PrismaService) {}
	async getMany<I extends SongQueryParameters.RelationInclude = {}>(
		where: SongQueryParameters.ManyWhereInput,
		sort?: SongGroupQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
		include?: I,
	): Promise<(SongWithRelations & { versionCount: number })[]> {
		const groups = await this.prismaService.songGroup.findMany({
			where: {
				versions: {
					some: SongService.formatManyWhereInput(where),
				},
			},
			orderBy: sort?.sortBy
				? ({
						[sort.sortBy === "name" ? "slug" : sort.sortBy]:
							sort?.order ?? "asc",
					} as const)
				: undefined,
			include: {
				_count: { select: { versions: true } },
				versions: {
					where: SongService.formatManyWhereInput(where),
					orderBy: { slug: "asc" },
					include: include ?? ({} as I),
					take: 1,
				},
			},
			...formatPaginationParameters(pagination),
		});
		return groups.map((g) => ({
			...g.versions[0],
			versionCount: g._count.versions,
		}));
	}
}
