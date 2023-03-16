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
import { AllProvidersFailedError, ProviderActionFailedError } from "./provider.exception";
import { AlbumType } from "@prisma/client";

describe("Provider Service", () => {
	let providerService: ProviderService;
	let settingsService: SettingsService;
	let prismaService: PrismaService;
	let fileManagerService: FileManagerService;
	let geniusService: GeniusProvider;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, SettingsModule, ProvidersModule, PrismaModule, FileManagerModule],
			providers: [MusixMatchProvider, GeniusProvider, MusicBrainzProvider, ProviderService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		providerService = module.get(ProviderService);
		prismaService = module.get(PrismaService);
		settingsService = module.get(SettingsService);
		fileManagerService = module.get(FileManagerService);
		geniusService = module.get(GeniusProvider);
		module.get(MusicBrainzProvider).onModuleInit();
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
	});

	describe('Get Album Type', () => {
		it('should return album type', async () => {
			expect(await providerService.getAlbumType('11,000 Clicks', 'Moloko'))
				.toBe(AlbumType.LiveRecording);
		});
	});

	describe('Get Album Description', () => {
		if (process.env.GITHUB_ACTIONS != 'true') {
			it("should get Description from Genius Provider", async () => {
				const description = await providerService.getAlbumDescription("Sour", "Olivia Rodrigo");
			
				expect(description
					.startsWith("SOUR is the debut studio album by Olivia Rodrigo, released through Geffen Records and Interscope Records")
				).toBeTruthy();
			});
		}
		it("should get Description from Musicbrainz Provider", async () => {
			jest.spyOn(geniusService, 'getAlbumDescription').mockImplementationOnce(() => {
				throw new ProviderActionFailedError('genius', 'getAlbumDescription', '');
			})
			expect((await providerService.getAlbumDescription("Sour", "Olivia Rodrigo"))
				.startsWith("Sour (stylized in all caps) is the debut studio album by American singer-songwriter Olivia Rodrigo.")
			).toBeTruthy();
		});
	});

	describe('Get Artist Description', () => {
		it("should get Description from Genius Provider", async () => {
			const description = await providerService.getArtistDescription("Moloko");

			expect(description
				.endsWith("which became an international hit.")
			).toBeTruthy();
		});
	});

	describe('Get Song Genres', () => {
		it("should collect all genres", async () => {
			const genres = await providerService.getSongGenres("One More Time", "Daft Punk");

			expect(genres).toContain('house');
			expect(genres).toContain('electronic');
			expect(genres).toContain('dance');
			expect(genres).toContain('electronica');
			expect(genres).toContain('disco');
		});
	});

	describe('Error handling', () => {
		it("should throw expected error when all providers failed", async () => {
			const test = () => providerService.getArtistDescription("");

			expect(test).rejects.toThrow(AllProvidersFailedError);
		});
	});
})