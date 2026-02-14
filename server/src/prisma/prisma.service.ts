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

import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "src/prisma/generated/client";

@Injectable()
export default class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		const adapter = new PrismaPg({
			connectionString: process.env.DATABASE_URL,
		});
		super({ adapter });

		this.$extends({
			query: {
				album: {
					async findMany({ args, query }) {
						args.include = {
							...args.include,
							releases: {
								take: 1,
								orderBy: {
									releaseDate: { sort: "asc", nulls: "last" },
								},
							},
						};

						const res = await query(args);

						return res.map((item) => ({
							...item,
							master:
								item.master === undefined
									? undefined
									: (item.master ??
										item.releases?.at(0) ??
										null),
							masterId:
								item.master === undefined
									? undefined
									: (item.masterId ??
										item.releases?.at(0)?.id ??
										null),
						}));
					},
				},
			},
		});
	}
	async onModuleDestroy() {
		await this.$disconnect();
	}
	async onModuleInit() {
		await this.$connect();
	}
}
