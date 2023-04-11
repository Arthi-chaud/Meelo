import { BullModule } from "@nestjs/bull";
import type { ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";

export function createTestingModule(metadata: ModuleMetadata) {
	return Test.createTestingModule({
		imports: metadata.imports?.concat(
			BullModule.forRoot({
				url: `redis://${process.env.REDIS_HOST ?? 'localhost'}:6379`,
				defaultJobOptions: {
					attempts: 1,
					removeOnComplete: true,
					removeOnFail: true
				}
			}),
		),
		exports: metadata.exports,
		providers: metadata.providers
	});
}