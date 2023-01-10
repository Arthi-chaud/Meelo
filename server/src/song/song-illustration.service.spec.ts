import TrackModule from "src/track/track.module";
import SongModule from "./song.module";
import SongIllustrationService from "./song-illustration.service";
import { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";

describe('Song Illustration Service', () => {
	let dummyRepository: TestPrismaService;
	let songIllustrationService: SongIllustrationService;
	let fileManagerService: FileManagerService;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, ArtistModule, AlbumModule, SettingsModule, ReleaseModule, SongModule, TrackModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		songIllustrationService = module.get(SongIllustrationService);
		dummyRepository = module.get(PrismaService);
		fileManagerService = module.get(FileManagerService);
		await dummyRepository.onModuleInit();
		module.get(ArtistIllustrationService).onModuleInit();
	});
	describe('Get Illustration Illustration', () => {
		it("should get Song's Master Track Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				await songIllustrationService.getIllustrationLink({ id: dummyRepository.songA1.id })
			).toBe(`/illustrations/tracks/${dummyRepository.trackA1_1.id}`)
		})
		it("should build Compilation Song Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(false);
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				await songIllustrationService.getIllustrationLink({ id: dummyRepository.songA2.id })
			).toBe(`/illustrations/releases/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}+${dummyRepository.releaseA1_2.slug}`)
		})
		it("should return null, as the illustration does not exist", async () => {
			expect(
				await songIllustrationService.getIllustrationLink({ id: dummyRepository.songA2.id })
			).toBeNull();
		})
	})
})