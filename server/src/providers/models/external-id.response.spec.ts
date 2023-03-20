import { HttpModule } from "@nestjs/axios";
import { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import GeniusProvider from "../genius/genius.provider";
import MusicBrainzProvider from "../musicbrainz/musicbrainz.provider";
import MusixMatchProvider from "../musixmatch/musixmatch.provider";
import ProviderService from "../provider.service";
import ProvidersModule from "../providers.module";
import { ExternalIdResponseBuilder } from "./external-id.response";

describe('External ID Response', () => {
	let providerService: ProviderService;
	let prismaService: PrismaService;
	let musicbrainzService: MusicBrainzProvider; 
	let responseBuilder: ExternalIdResponseBuilder;
	//TODO Test Provider Image
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, SettingsModule, ProvidersModule, PrismaModule, FileManagerModule],
			providers: [MusixMatchProvider, GeniusProvider, MusicBrainzProvider, ProviderService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		providerService = module.get(ProviderService);
		prismaService = module.get(PrismaService);
		responseBuilder = module.get(ExternalIdResponseBuilder);
		musicbrainzService = module.get(MusicBrainzProvider);
		musicbrainzService.onModuleInit();
		await providerService.onModuleInit();
	});
	it("Should format Artist External ID", async () => {
		const provider = await prismaService.provider.findUniqueOrThrow({ where: { name: musicbrainzService.name } });
		const response = await responseBuilder.buildResponse({
			id: 0,
			providerId: provider.id,
			artistId: 0,
			value: 'P-nk',
		})
		expect(response.value).toBe('P-nk');
		expect(response.url).toBe('https://musicbrainz.org/artist/P-nk');
		expect(response.provider).toBeDefined();
		expect(response.provider.name).toBe(provider.name);
	});
	it("Should format Album External ID", async () => {
		const provider = await prismaService.provider.findUniqueOrThrow({ where: { name: musicbrainzService.name } });
		const response = await responseBuilder.buildResponse({
			id: 0,
			providerId: provider.id,
			albumId: 0,
			value: 'P-nk',
		})
		expect(response.value).toBe('P-nk');
		expect(response.url).toBe('https://musicbrainz.org/release-group/P-nk');
		expect(response.provider).toBeDefined();
		expect(response.provider.name).toBe(provider.name);
	});
	it("Should format Song External ID", async () => {
		const provider = await prismaService.provider.findUniqueOrThrow({ where: { name: musicbrainzService.name } });
		const response = await responseBuilder.buildResponse({
			id: 0,
			providerId: provider.id,
			songId: 0,
			value: 'P-nk',
		})
		expect(response.value).toBe('P-nk');
		expect(response.url).toBe('https://musicbrainz.org/work/P-nk');
		expect(response.provider).toBeDefined();
		expect(response.provider.name).toBe(provider.name);
	});
})