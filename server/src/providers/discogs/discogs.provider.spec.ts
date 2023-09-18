import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";
import DiscogsProvider from "./discogs.provider";

describe('Discogs Provider', () => {
	let discogsProvider: DiscogsProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [DiscogsProvider],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		discogsProvider = module.get(DiscogsProvider);
		discogsProvider.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	describe('Get Release URL', () => {
		it('should build the correct URL', () => {
			expect(discogsProvider.getReleaseURL('123456'))
				.toBe('https://www.discogs.com/release/123456')
		})
	})
})