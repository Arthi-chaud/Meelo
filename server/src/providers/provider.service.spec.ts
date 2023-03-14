import { HttpModule } from "@nestjs/axios";
import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import ProviderService from "./provider.service";
import ProvidersModule from "./providers.module";
import PrismaModule from "src/prisma/prisma.module";
import MusixMatchProvider from "./musixmatch/musixmatch.provider";
import GeniusProvider from "./genius/genius.provider";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";
import SettingsService from "src/settings/settings.service";
import FileManagerService from "src/file-manager/file-manager.service";
import * as fs from 'fs';
import FileManagerModule from "src/file-manager/file-manager.module";

describe("Provider Service", () => {
	let providerService: ProviderService;
	let settingsService: SettingsService;
	let prismaService: PrismaService;
	let fileManagerService: FileManagerService;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, SettingsModule, ProvidersModule, PrismaModule, FileManagerModule],
			providers: [MusixMatchProvider, GeniusProvider, MusicBrainzProvider, ProviderService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		providerService = module.get(ProviderService);
		prismaService = module.get(PrismaService);
		settingsService = module.get(SettingsService);
		fileManagerService = module.get(FileManagerService);
		await providerService.onModuleInit();
	});

	describe('Push Providers to DB', () => {
		it("Should have pushed the providers to the database", async () => {
			const providers = await prismaService.provider.findMany();
			const providersSlugs = providers.map(({ slug }) => slug);

			expect(providers.length).toBe(3);
			expect(providersSlugs).toContain('musicbrainz');
			expect(providersSlugs).toContain('musixmatch');
			expect(providersSlugs).toContain('genius');
		})
	});

	describe('Check Provider Enabling', () => {
		it("should have disabled one explicitly, one implicitly", async () => {
			jest.spyOn(fileManagerService, 'getFileContent').mockImplementationOnce(
				() => fs.readFileSync('test/assets/settings-provider-disabled.json').toString()
			);
			settingsService.loadFromFile();
			await providerService.onModuleInit();
			expect(providerService.enabledProviders.length).toBe(1);
			expect(providerService.enabledProviders).toContain('musixmatch');
		});
		it("should have enabled 3", async () => {
			settingsService.loadFromFile();
			await providerService.onModuleInit();
			expect(providerService.enabledProviders.length).toBe(3);
			expect(providerService.enabledProviders).toContain('musixmatch');
			expect(providerService.enabledProviders).toContain('genius');
			expect(providerService.enabledProviders).toContain('musicbrainz');
		})
	})
})