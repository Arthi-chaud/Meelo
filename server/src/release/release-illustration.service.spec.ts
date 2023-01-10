import { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import ReleaseIllustrationService from "./release-illustration.service";
import ReleaseModule from "./release.module";
import Slug from "src/slug/slug";

describe('Release Illustration Service', () => {
	let dummyRepository: TestPrismaService;
	let releaseIllustrationService: ReleaseIllustrationService;
	let fileManagerService: FileManagerService;
	const baseMetadataFolder = 'test/assets/metadata';

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, ArtistModule, AlbumModule, SettingsModule, ReleaseModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		releaseIllustrationService = module.get(ReleaseIllustrationService);
		dummyRepository = module.get(PrismaService);
		fileManagerService = module.get(FileManagerService);
		await dummyRepository.onModuleInit();
		module.get(ArtistIllustrationService).onModuleInit();
	});

	describe('build Illustration Folder Path', () => {
		it("should build Release Illustration Folder Path", () => {
			expect(releaseIllustrationService.buildIllustrationFolderPath(
				new Slug('My Artist'), new Slug('My Album'), new Slug("My Release"), 
			)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-release`);
		})
		it("should build Compilation Release Illustration Folder Path", () => {
			expect(releaseIllustrationService.buildIllustrationFolderPath(
				undefined, new Slug('My Album'), new Slug("My Release"), 
			)).toBe(`${baseMetadataFolder}/compilations/my-album/my-release`);
		})
	})
	describe('build Illustration Path', () => {
		it("should build Release Illustration Path", () => {
			expect(releaseIllustrationService.buildIllustrationPath(
				new Slug('My Artist'), new Slug('My Album'), new Slug("My Album"), 
			)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album/cover.jpg`);
		})
		it("should build Compilation Release Illustration Path", () => {
			expect(releaseIllustrationService.buildIllustrationPath(
				undefined, new Slug('My Album'), new Slug("My Album"), 
			)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album/cover.jpg`);
		})
	})
	describe('Get Illustration Illustration', () => {
		it("should get Release Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				await releaseIllustrationService.getIllustrationLink({ id: dummyRepository.releaseB1_1.id })
			).toBe(`/illustrations/releases/${dummyRepository.artistB.slug}+${dummyRepository.albumB1.slug}+${dummyRepository.releaseB1_1.slug}`);
		})
		it("should build Compilation Release Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				await releaseIllustrationService.getIllustrationLink({ id: dummyRepository.compilationReleaseA1.id })
			).toBe(`/illustrations/releases/compilations+${dummyRepository.compilationAlbumA.slug}+${dummyRepository.compilationReleaseA1.slug}`);
		})
		it("should return null, as the illustration does not exist", async () => {
			expect(
				await releaseIllustrationService.getIllustrationLink({ id: dummyRepository.releaseA1_1.id })
			).toBeNull();
		})
	})
})