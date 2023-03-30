import type { ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";

export function createTestingModule(metadata: ModuleMetadata) {
	return Test.createTestingModule({
		imports: metadata.imports,
		exports: metadata.exports,
		providers: metadata.providers
	});
}