import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		await this.$connect();
		if (process.env.NODE_ENV === 'dev') {
			await this.flushDatabase();
		}
	}
	
	async enableShutdownHooks(app: INestApplication) {
		this.$on('beforeExit', async () => {
			await app.close();
		});
	}

	protected async flushDatabase() {
		Logger.warn("Flushing database");
		const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`
		for (const { tablename } of tablenames) {
		  if (tablename !== '_prisma_migrations') {
			try {
			  await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
			} catch (error) {
			  Logger.error(`Flushing table '${tablename}' failed`)
			}
		  }
		}
	}
}