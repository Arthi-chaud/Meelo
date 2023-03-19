import type { ModuleMetadata } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Test } from "@nestjs/testing";

export function createTestingModule(metadata: ModuleMetadata) {
	return Test.createTestingModule({
		imports: [...metadata.imports ?? [], EventEmitterModule.forRoot()],
		exports: metadata.exports,
		providers: metadata.providers
	});
}