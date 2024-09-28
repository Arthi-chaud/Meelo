import { AmqpConnection, RabbitMQModule } from "@golevelup/nestjs-rabbitmq";
import { Module, type ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MemoryStoredFile, NestjsFormDataModule } from "nestjs-form-data";
import { MeiliSearchModule } from "nestjs-meilisearch";
import { createMock } from "@golevelup/ts-jest";
import { EventsModule } from "src/events/events.module";
import { EventsService } from "src/events/events.service";

@Module({
	imports: [RabbitMQModule.forRoot(RabbitMQModule)],
	providers: [
		{
			provide: AmqpConnection,
			useValue: createMock<AmqpConnection>(),
		},
		EventsService,
	],
	exports: [AmqpConnection, EventsService],
})
class MockEventsModule {}

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
		exports: [AmqpConnection, ...(metadata.exports ?? [])],
		providers: [
			{
				provide: AmqpConnection,
				useValue: createMock<AmqpConnection>(),
			},
			...(metadata.providers ?? []),
		],
	})
		.overrideModule(EventsModule)
		.useModule(MockEventsModule);
}
