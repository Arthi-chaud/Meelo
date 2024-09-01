import { BullModule } from "@nestjs/bull";
import type { ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MemoryStoredFile, NestjsFormDataModule } from "nestjs-form-data";
import { MeiliSearchModule } from "nestjs-meilisearch";

export function createTestingModule(metadata: ModuleMetadata) {
	return Test.createTestingModule({
		imports: metadata.imports?.concat(
			BullModule.forRoot({
				url: `redis://${process.env.REDIS_HOST ?? "localhost"}:6379`,
				defaultJobOptions: {
					attempts: 1,
					removeOnComplete: true,
					removeOnFail: true,
				},
			}),
			MeiliSearchModule.forRoot({
				host: process.env.MEILI_HOST ?? "localhost:7700",
				apiKey: process.env.MEILI_MASTER_KEY,
			}),
			NestjsFormDataModule.config({
				storage: MemoryStoredFile,
				isGlobal: true,
				cleanupAfterSuccessHandle: true,
				cleanupAfterFailedHandle: true,
			}),
		),
		exports: metadata.exports,
		providers: metadata.providers,
	});
}
