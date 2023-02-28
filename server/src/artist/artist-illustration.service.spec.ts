import { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import ArtistIllustrationService from "./artist-illustration.service";
import ArtistModule from "./artist.module";
import Slug from "src/slug/slug";
import AlbumModule from "src/album/album.module";
import ReleaseModule from "src/release/release.module";

describe('Artist Illustration Service', () => {
	let dummyRepository: TestPrismaService;
	let artistIllustrationService: ArtistIllustrationService;
	let fileManagerService: FileManagerService;
	const baseMetadataFolder = 'test/assets/metadata';

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, ArtistModule, SettingsModule, AlbumModule, ReleaseModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		fileManagerService = module.get(FileManagerService);
		await dummyRepository.onModuleInit();
		artistIllustrationService = module.get(ArtistIllustrationService);
		artistIllustrationService.onModuleInit();
	});
	describe('build Illustration Folder Path', () => {
		it("should build Artist Illustration Folder Path", () => {
			expect(artistIllustrationService.buildIllustrationFolderPath(
				new Slug('My Artist')
			)).toBe(`${baseMetadataFolder}/my-artist`);
		})
		it("should build Compilation  Illustration Folder Path", () => {
			expect(artistIllustrationService.buildIllustrationFolderPath(
				undefined
			)).toBe(`${baseMetadataFolder}/compilations`);
		})
	})
	describe('build Illustration Path', () => {
		it("should build Artist Illustration Path", () => {
			expect(artistIllustrationService.buildIllustrationPath(
				new Slug('My Artist')
			)).toBe(`${baseMetadataFolder}/my-artist/cover.jpg`);
		})
	})
	describe('Get Illustration Illustration', () => {
		it("should get Artist Illustration Link (using ID)", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				artistIllustrationService.buildIllustrationLink(dummyRepository.artistA.id)
			).toBe(`/illustrations/artists/${dummyRepository.artistA.id}`);
		})
		it("should get Artist Illustration Link (using Slug)", async () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			expect(
				artistIllustrationService.buildIllustrationLink(new Slug(dummyRepository.artistB.slug).toString())
			).toBe(`/illustrations/artists/${dummyRepository.artistB.slug}`);
		})
	})
})