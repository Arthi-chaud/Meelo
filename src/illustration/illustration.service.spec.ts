import { HttpModule } from "@nestjs/axios";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import Slug from "src/slug/slug";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import IllustrationService from "./illustration.service";
import IllustrationModule from "./illustration.module";
import * as fs from 'fs';

describe('Illustration Service', () => {
	let illustrationService: IllustrationService;
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	const baseMetadataFolder = 'test/assets/metadata';

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, FileManagerModule, IllustrationModule, PrismaModule, ArtistModule, MetadataModule, SettingsModule],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		illustrationService = module.get<IllustrationService>(IllustrationService);
		illustrationService.onModuleInit();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		await module.get<ArtistService>(ArtistService).create({ name: 'My Artist' });
	});

	it('should be defined', () => {
		expect(albumService).toBeDefined();
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
				const album = await albumService.create({ name: 'My Album', artist: { slug: new Slug('My Artist') } });
				await releaseService.getOrCreate({
					title: 'My Album (Deluxe Edition)', album: { byId: { id: album.id } }, master: true
				});
				expect(await illustrationService.buildMasterReleaseIllustrationPath(
					new Slug('My Album'), new Slug('My Artist')
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/cover.jpg`);
			});
			it('should build the album illustration path (compilation)', async() => {
				const album = await albumService.create({ name: 'My Other Album' })
				await releaseService.getOrCreate({
					title: 'My Other Album (Deluxe Edition)', album: { byId: { id: album.id } }, master: true
				});
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
				expect(illustrationService.buildTrackIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), new Slug('My Artist'), 1, 2
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/disc-1-track-2/cover.jpg`);
			});
			it('should build the track illustration path (no disc provided)', async () => {
				expect(illustrationService.buildTrackIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), new Slug('My Artist'), undefined, 2
				)).toBe(`${baseMetadataFolder}/my-artist/my-album/my-album-deluxe-edition/track-2/cover.jpg`);
			});
			it('should build the track illustration path (compilation)', async () => {
				expect(illustrationService.buildTrackIllustrationPath(
					new Slug('My Album'), new Slug('My Album (Deluxe Edition)'), undefined, 1, 2
				)).toBe(`${baseMetadataFolder}/compilations/my-album/my-album-deluxe-edition/disc-1-track-2/cover.jpg`);
			});
		});

		describe('should extract illustration', () => {
			const outPath = `${baseMetadataFolder}/illustration.jpg`;
			it("should write data to file", async () => {
				fs.rmSync(outPath);
				illustrationService['saveIllustration'](Buffer.from('ABC'), outPath);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(Buffer.from('ABC'));
			});
			it("should re-write data to file", async () => {
				illustrationService['saveIllustration'](Buffer.from('ABCDE'), outPath);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(Buffer.from('ABCDE'));
			});

			it("should extract the illustration to the file, with success status", async () => {
				fs.rmSync(outPath);
				const status = await illustrationService['saveIllustrationWithStatus'](Buffer.from('ABC'), outPath);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(Buffer.from('ABC'));
				expect(status).toBe('extracted');
			});

			it("should not extract the illustration to the file, with 'already-extracted' status", async () => {
				const status = await illustrationService['saveIllustrationWithStatus'](Buffer.from('ABC'), outPath);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(Buffer.from('ABC'));
				expect(status).toBe('already-extracted');
			});

			it("should not extract the illustration to the file, with 'different-illustration' status", async () => {
				const status = await illustrationService['saveIllustrationWithStatus'](Buffer.from('ABCD'), outPath);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(Buffer.from('ABC'));
				expect(status).toBe('different-illustration');
			});
		});
	});
});