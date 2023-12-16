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
