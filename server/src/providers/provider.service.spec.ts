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

describe("Provider Service", () => {
	let providerService: ProviderService;
	let prismaService: PrismaService;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, SettingsModule, ProvidersModule, PrismaModule],
			providers: [MusixMatchProvider, GeniusProvider, MusicBrainzProvider, ProviderService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		providerService = module.get(ProviderService);
		prismaService = module.get(PrismaService);
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
	})
})