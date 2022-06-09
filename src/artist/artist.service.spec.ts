import { Test, TestingModule } from "@nestjs/testing";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { SettingsModule } from "src/settings/settings.module";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { ArtistModule } from "./artist.module";
import { ArtistService } from "./artist.service"

describe('Artist Service', () => {
	let artistService: ArtistService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ArtistModule, PrismaModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
	});

	it('should be defined', () => {
		expect(artistService).toBeDefined();
	});

	it(('should create a new artist'), async () => {
		let artistName = 'My name';
		let artist = await artistService.createArtist(artistName);
		expect(artist.songs).toBeUndefined();
		expect(artist.albums).toBeUndefined();
		expect(artist.name).toBe(artistName);
		expect(artist.slug).toBe('my-name');
		expect(artist.id).toBeDefined();
	})
})