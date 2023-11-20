import { HttpModule } from "@nestjs/axios";
import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import ProviderService from "./provider.service";
import PrismaModule from "src/prisma/prisma.module";
import GeniusProvider from "./genius/genius.provider";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";
import SettingsService from "src/settings/settings.service";
import FileManagerService from "src/file-manager/file-manager.service";
import * as fs from 'fs';
import FileManagerModule from "src/file-manager/file-manager.module";
import IllustrationModule from "src/illustration/illustration.module";
import { forwardRef } from "@nestjs/common";
import ProvidersModule from "./providers.module";

describe("Provider Service", () => {
	let providerService: ProviderService;
	let settingsService: SettingsService;
	let prismaService: PrismaService;
	let fileManagerService: FileManagerService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, ProvidersModule, SettingsModule, PrismaModule, FileManagerModule, forwardRef(() => IllustrationModule)],
			providers: [GeniusProvider, MusicBrainzProvider, ProviderService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		providerService = module.get(ProviderService);
		prismaService = module.get(PrismaService);
		settingsService = module.get(SettingsService);
		fileManagerService = module.get(FileManagerService);
		module.get(MusicBrainzProvider).onModuleInit();
		await providerService.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	describe('Push Providers to DB', () => {
		it("Should have pushed the providers to the database", async () => {
			const providers = await prismaService.provider.findMany();
			const providersSlugs = providers.map(({ slug }) => slug);

			expect(providers.length).toBe(6);
			expect(providersSlugs).toContain('musicbrainz');
			expect(providersSlugs).toContain('genius');
			expect(providersSlugs).toContain('discogs');
			expect(providersSlugs).toContain('allmusic');
			expect(providersSlugs).toContain('metacritic');
			expect(providersSlugs).toContain('wikipedia');
		})
	});

	describe('Check Provider Enabling', () => {
		it("should have disabled one explicitly, one implicitly", async () => {
			jest.spyOn(fileManagerService, 'getFileContent').mockImplementationOnce(
				() => fs.readFileSync('test/assets/settings-provider-disabled.json').toString()
			);
			settingsService.loadFromFile();
			await providerService.onModuleInit();
			expect(providerService.enabledProviders.length).toBe(0);
		});
		it("should have enabled 2", async () => {
			settingsService.loadFromFile();
			await providerService.onModuleInit();
			expect(providerService.enabledProviders.length).toBe(2);
			expect(providerService.enabledProviders.map((p) => p.name)).toContain('genius');
			expect(providerService.enabledProviders.map((p) => p.name)).toContain('musicbrainz');
		})
	});
})