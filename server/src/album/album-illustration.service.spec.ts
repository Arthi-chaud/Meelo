import TestPrismaService from "test/test-prisma.service";
import AlbumIllustrationService from "./album-illustration.service";
import AlbumModule from "./album.module";
import { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import ReleaseModule from "src/release/release.module";
import Slug from "src/slug/slug";
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import FileManagerService from "src/file-manager/file-manager.service";

describe('Album Illustration Service', () => {
	let dummyRepository: TestPrismaService;
	let albumIllustrationService: AlbumIllustrationService;
	let fileManagerService: FileManagerService;
	const baseMetadataFolder = 'test/assets/metadata';

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, ArtistModule, AlbumModule, SettingsModule, ReleaseModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		albumIllustrationService = module.get<AlbumIllustrationService>(AlbumIllustrationService);
		dummyRepository = module.get(PrismaService);
		fileManagerService = module.get(FileManagerService);
		await dummyRepository.onModuleInit();
		module.get(ArtistIllustrationService).onModuleInit();
	});

	describe('build Illustration Folder Path', () => {
		it("should build Album Illustration Folder Path", () => {
			expect(albumIllustrationService.buildIllustrationFolderPath(
				new Slug('My Artist'), new Slug('My Album'), 
			)).toBe(`${baseMetadataFolder}/my-artist/my-album`);
		})
		it("should build Compilation Album Illustration Folder Path", () => {
			expect(albumIllustrationService.buildIllustrationFolderPath(
				undefined, new Slug('My Other Album')
			)).toBe(`${baseMetadataFolder}/compilations/my-other-album`);
		})
	})
	describe('build Illustration Path', () => {
		it("should build Album Illustration Path", () => {
			expect(albumIllustrationService.buildIllustrationPath(
				new Slug('A'), new Slug('B'), 
			)).toBe(`${baseMetadataFolder}/a/b/cover.jpg`);
		})
		it("should build Compilation Album Illustration Path", () => {
			expect(albumIllustrationService.buildIllustrationPath(
				undefined, new Slug('Album'), 
			)).toBe(`${baseMetadataFolder}/compilations/album/cover.jpg`);
		})
	})
	describe('Get Illustration Illustration', () => {
		it("should get Album Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				await albumIllustrationService.getIllustrationLink({ id: dummyRepository.albumA1.id })
			).toBe(`/illustrations/releases/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}+${dummyRepository.releaseA1_1.slug}`);
		})
		it("should build Compilation Album Illustration Link", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				await albumIllustrationService.getIllustrationLink({ id: dummyRepository.compilationAlbumA.id })
			).toBe(`/illustrations/releases/compilations+${dummyRepository.compilationAlbumA.slug}+${dummyRepository.compilationReleaseA1.slug}`);
		})
		it("should return null, as the illustration does not exist", async () => {
			expect(
				await albumIllustrationService.getIllustrationLink({ id: dummyRepository.albumA1.id })
			).toBeNull();
		})
	})
})