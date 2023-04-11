import ArtistIllustrationService from "src/artist/artist-illustration.service";
import TrackIllustrationService from "./track-illustration.service";
import FileManagerService from "src/file-manager/file-manager.service";
import TestPrismaService from "test/test-prisma.service";
import ArtistModule from "src/artist/artist.module";
import { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import Slug from "src/slug/slug";
import TrackModule from "./track.module";

describe('Track Illustration Service', () => {
	let dummyRepository: TestPrismaService;
	let trackIllustrationService: TrackIllustrationService;
	let fileManagerService: FileManagerService;
	const baseMetadataFolder = 'test/assets/metadata';

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, ArtistModule, AlbumModule, SettingsModule, ReleaseModule, TrackModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		trackIllustrationService = module.get(TrackIllustrationService);
		dummyRepository = module.get(PrismaService);
		fileManagerService = module.get(FileManagerService);
		await dummyRepository.onModuleInit();
		fileManagerService;
		module.get(ArtistIllustrationService).onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	describe('build Illustration Folder Path', () => {
		it("should build Track Illustration Folder Path", () => {
			expect(trackIllustrationService.buildIllustrationFolderPath(
				new Slug('My Artist'), new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), 1, 2
			)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/disc-1-track-2`);
		});
		it("should build Track Illustration Folder Path, from compilation release", () => {
			expect(trackIllustrationService.buildIllustrationFolderPath(
				undefined, new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), 10, 2
			)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album-deluxe-edition/disc-10-track-2`)
		})
	})
	describe('build Illustration Path', () => {
		it("should build Track Illustration Path", () => {
			expect(trackIllustrationService.buildIllustrationPath(
				new Slug('My Artist'), new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), 1, 2
			)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/disc-1-track-2/cover.jpg`);
		})
		it("should build Track Illustration Path,  from compilation release", () => {
			expect(trackIllustrationService.buildIllustrationPath(
				undefined, new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), 10, 2
			)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album-deluxe-edition/disc-10-track-2/cover.jpg`)
		})
	})
	describe('Get Illustration Illustration', () => {
		it("should get Track Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(trackIllustrationService.buildIllustrationLink(
				dummyRepository.trackB1_1.id
			)).toBe(`/illustrations/tracks/${dummyRepository.trackB1_1.id}`);
		})
		it("should get Track Illustration Link, from compilation release", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(trackIllustrationService.buildIllustrationLink(
				dummyRepository.trackC1_1.id
			)).toBe(`/illustrations/tracks/${dummyRepository.trackC1_1.id}`);
		})
	})
})