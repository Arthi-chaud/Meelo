import { HttpModule } from "@nestjs/axios";
import { Test, TestingModule } from "@nestjs/testing";
import { AlbumModule } from "src/album/album.module";
import { ArtistModule } from "src/artist/artist.module";
import { FileManagerModule } from "src/file-manager/file-manager.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { MetadataModule } from "src/metadata/metadata.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { ReleaseModule } from "src/release/release.module";
import { ReleaseService } from "src/release/release.service";
import { Slug } from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { IllustrationModule } from "./illustration.module";
import { IllustrationService } from "./illustration.service";

describe('Library Service', () => {
	let illustrationService: IllustrationService;
	let releaseService: ReleaseService;
	const baseMetadataFolder = 'test/assets/metadata';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [IllustrationModule, PrismaModule, AlbumModule, ArtistModule, FileManagerModule, MetadataModule, ReleaseModule, HttpModule],
			providers: [IllustrationService, ReleaseService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		illustrationService = module.get<IllustrationService>(IllustrationService);
		releaseService = module.get<ReleaseService>(ReleaseService);
	});

	it('should be defined', () => {
		expect(illustrationService).toBeDefined();
		expect(releaseService).toBeDefined();
	});

	describe('Build Illustration paths', () => {
		describe('Build Illustration folder path', () => { 
			it('should build the compilation "artist" metadata folder path', () => {
				expect(illustrationService.buildCompilationIllustrationFolderPath())
					.toBe(`${baseMetadataFolder}/compilations`);
				expect(illustrationService.buildArtistIllustrationFolderPath())
					.toBe(`${baseMetadataFolder}/compilations`);
			});
			it('should build the artist metadata folder path', () => {
				expect(illustrationService.buildArtistIllustrationFolderPath(new Slug('My Artist')))
					.toBe(`${baseMetadataFolder}/my-artist`);
				expect(illustrationService.buildArtistIllustrationFolderPath(new Slug('My Other Artist')))
					.toBe(`${baseMetadataFolder}/my-other-artist`);
			});
			it('should build the album metadata folder path', () => {
				expect(illustrationService.buildAlbumIllustrationFolderPath(
					new Slug('My Album'), new Slug('My Artist')
				)).toBe(`${baseMetadataFolder}/my-artist/my-album`);
			});
			it('should build the album metadata folder path (compilation)', () => {
				expect(illustrationService.buildAlbumIllustrationFolderPath(
					new Slug('My Other Album')
				)).toBe(`${baseMetadataFolder}/compilations/my-other-album`);
			});
			it('should build the release metadata folder path', () => {
				expect(illustrationService.buildReleaseIllustrationFolderPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), new Slug('My Artist')
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition`);
			});
			it('should build the release metadata folder path (compilation)', () => {
				expect(illustrationService.buildReleaseIllustrationFolderPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)')
				)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album-deluxe-edition`);
			});
		});
		describe('Build Illustration path', () => { 
			it('should build the compilation "artist" illustration path', () => {
				expect(illustrationService.buildArtistIllustrationPath())
					.toBe(`${baseMetadataFolder}/compilations/cover.jpg`);
			});
			it('should build the artist illustration path', () => {
				expect(illustrationService.buildArtistIllustrationPath(new Slug('My Artist')))
					.toBe(`${baseMetadataFolder}/my-artist/cover.jpg`);
				expect(illustrationService.buildArtistIllustrationPath(new Slug('My Other Artist')))
					.toBe(`${baseMetadataFolder}/my-other-artist/cover.jpg`);
			});
			it('should build the album illustration path', async () => {
				await releaseService.findOrCreateRelease(
					'My Album (Deluxe Edition)', 'My Album', 'My Artist'
				);
				expect(await illustrationService.buildMasterReleaseIllustrationPath(
					new Slug('My Album'), new Slug('My Artist')
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/cover.jpg`);
			});
			it('should build the album illustration path (compilation)', async() => {
				await releaseService.findOrCreateRelease(
					'My Other Album (Deluxe Edition)', 'My Other Album'
				);
				expect(await illustrationService.buildMasterReleaseIllustrationPath(
					new Slug('My Other Album')
				)).toBe(`${baseMetadataFolder}/compilations/my-other-album/my-other-album-deluxe-edition/cover.jpg`);
			});
			it('should build the release illustration path', () => {
				expect(illustrationService.buildReleaseIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), new Slug('My Artist')
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/cover.jpg`);
			});
			it('should build the release illustration path (compilation)', () => {
				expect(illustrationService.buildReleaseIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)')
				)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album-deluxe-edition/cover.jpg`);
			});
			it('should build the track illustration path', async () => {
				expect(await illustrationService.buildTrackIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), new Slug('My Artist'), 1, 2
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/disc-1-track-2/cover.jpg`);
			});
			it('should build the track illustration path (no disc provided)', async () => {
				expect(await illustrationService.buildTrackIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), new Slug('My Artist'), undefined, 2
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/track-2/cover.jpg`);
			});
			it('should build the track illustration path (compilation)', async () => {
				expect(await illustrationService.buildTrackIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), undefined, 1, 2
				)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album-deluxe-edition/disc-1-track-2/cover.jpg`);
			});
		});
	});
});