import type { ModuleMetadata } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UrlGeneratorModule } from "nestjs-url-generator";

export function createTestingModule(metadata: ModuleMetadata) {
	return Test.createTestingModule({
		imports: [ ...metadata.imports ?? [], UrlGeneratorModule.forRootAsync({
			useFactory: () => ({
				appUrl: 'http://meelo.com',
			}),
		})],
		exports: metadata.exports,
		providers: metadata.providers
	});
}