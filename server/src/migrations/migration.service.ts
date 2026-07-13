import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import LabelService from "src/label/label.service";
import Logger from "src/logger/logger";
import PrismaService from "src/prisma/prisma.service";

@Injectable()
export default class MigrationService implements OnApplicationBootstrap {
	private readonly logger = new Logger(MigrationService.name);
	constructor(
		@Inject(PrismaService) private prismaService: PrismaService,
		private labelService: LabelService,
	) {}

	async onApplicationBootstrap() {
		let executedMigrations = 0;
		const migrationsDone = await this.prismaService.softMigration.findMany({
			orderBy: { executedAt: "asc" },
		});
		const runMigration = async (
			migrationName: string,
			action: () => Promise<void>,
		) => {
			if (migrationsDone.find((m) => m.name === migrationName)) {
				return;
			}
			try {
				this.logger.log(`Running migration '${migrationName}'`);
				await action();
				await this.prismaService.softMigration.create({
					data: { name: migrationName },
				});
				this.logger.log(
					`Migration '${migrationName}' run successfully`,
				);
				executedMigrations += 1;
			} catch (e) {
				this.logger.error(
					`An error occured when running migration '${migrationName}'`,
				);
				throw e;
			}
		};

		await runMigration("First migration", async () =>
			this.logger.log("Hello World"),
		);

		await runMigration("Add Labels search entries", async () => {
			let items = await this.prismaService.label.findMany({
				take: 30,
				orderBy: { id: "asc" },
			});
			while (items.length > 0) {
				await Promise.all(
					items.map((label) =>
						this.labelService._addToMeilisearch(label),
					),
				);
				items = await this.prismaService.label.findMany({
					take: 30,
					skip: 1,
					cursor: { id: items[items.length - 1].id },
					orderBy: { id: "asc" },
				});
			}
		});

		this.logger.log(
			executedMigrations === 0
				? "No migrations to run"
				: `Finished running ${executedMigrations} migrations`,
		);
	}
}
