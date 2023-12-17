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

import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import Logger from "src/logger/logger";

@Injectable()
export default class PrismaService
	extends PrismaClient
	implements OnModuleInit
{
	private readonly logger = new Logger(PrismaService.name);
	async onModuleInit() {
		await this.$connect();
		// if (process.env.NODE_ENV === 'development') {
		// 	await this.flushDatabase();
		// }
	}

	async enableShutdownHooks(app: INestApplication) {
		this.$on("beforeExit", async () => {
			await app.close();
		});
	}

	protected async flushDatabase() {
		this.logger.warn("Flushing database");
		const tablenames = await this.$queryRaw<
			Array<{ tablename: string }>
		>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

		for (const { tablename } of tablenames) {
			if (tablename !== "_prisma_migrations") {
				try {
					await this.$executeRawUnsafe(
						`TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
					);
				} catch (error) {
					this.logger.error(`Flushing table '${tablename}' failed`);
				}
			}
		}
	}
}
