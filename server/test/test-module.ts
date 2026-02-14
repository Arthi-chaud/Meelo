/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: Tests **/
import { Module, type ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MemoryStoredFile, NestjsFormDataModule } from "nestjs-form-data";
import { MeiliSearchModule } from "nestjs-meilisearch";
import { EventsModule } from "src/events/events.module";
import { EventsService } from "src/events/events.service";

@Module({})
class MockEventsService {
	constructor() {}
	publishItemCreationEvent(resourceType: any, name: string, id: number) {}
}

@Module({
	imports: [],
	providers: [{ provide: EventsService, useClass: MockEventsService }],
	exports: [{ provide: EventsService, useClass: MockEventsService }],
})
export class MockEventsModule {}

export function createTestingModule(metadata: ModuleMetadata) {
	return Test.createTestingModule({
		imports: metadata.imports?.concat(
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
			EventsModule,
		),
		exports: [...(metadata.exports ?? [])],
		providers: [...(metadata.providers ?? [])],
	})
		.overrideModule(EventsModule)
		.useModule(MockEventsModule);
}
