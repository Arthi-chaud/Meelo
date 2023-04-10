import { HttpModule } from "@nestjs/axios";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import IllustrationService from "./illustration.service";
import IllustrationModule from "./illustration.module";
import * as fs from 'fs';
import TestPrismaService from "test/test-prisma.service";
import Jimp from 'jimp';
import { FileDoesNotExistException } from "src/file-manager/file-manager.exceptions";
import { FileParsingException } from "src/metadata/metadata.exceptions";
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import ProvidersModule from "src/providers/providers.module";

describe('Illustration Service', () => {
	let illustrationService: IllustrationService;
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	const baseMetadataFolder = 'test/assets/metadata';
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, FileManagerModule, IllustrationModule, PrismaModule, ArtistModule, MetadataModule, SettingsModule, ProvidersModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		illustrationService = module.get<IllustrationService>(IllustrationService);
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		dummyRepository = module.get(PrismaService);
		module.get(ArtistIllustrationService).onModuleInit();
		await dummyRepository.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	it('should be defined', () => {
		expect(albumService).toBeDefined();
		expect(illustrationService).toBeDefined();
		expect(releaseService).toBeDefined();
	});

	describe('Build Illustration paths', () => {

		describe('Illustration extraction', () => {
			const outPath = `${baseMetadataFolder}/illustration.jpg`;
			it("should write data to file", async () => {
				if (fs.existsSync(outPath))
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

			it("should not extract illustration to matching folder, as the source file does not exist", async () => {
				const test = () => illustrationService.extractTrackIllustration(dummyRepository.trackA1_1, 'trololol');
				expect(test()).rejects.toThrow(FileDoesNotExistException);
			});

			it("should not extract illustration to matching folder, as the source file is not valid", async () => {
				const test = () => illustrationService.extractTrackIllustration(dummyRepository.trackA1_1, 'test/assets/settings.json');
				expect(test()).rejects.toThrow(FileParsingException);
			});


			it("should not extract illustration to matching folder, as illustration already exists", async () => {
				const path = await illustrationService.extractTrackIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a');
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(Buffer.from('ABC'));
				expect(path).toBe(null);
			});

			it("should not extract illustration to matching folder, as their is no embedded illustration", async () => {
				fs.rmSync(outPath);
				const path = await illustrationService.extractTrackIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a');
				expect(fs.existsSync(outPath)).toBe(false);
				expect(path).toBe(null);
			});

			let releaseIllustrationPath: string;
			it("should extract illustration to release folder, mocking the illustration bytes", async () => {
				jest.spyOn(IllustrationService.prototype as any, 'extractIllustrationFromFile').mockImplementationOnce(() => 'aaaaa' );
				jest.spyOn(Jimp, 'read').mockImplementationOnce(() => <any>({ getBufferAsync: (_: any) => Buffer.from('ABCDE') }));
				releaseIllustrationPath = (await illustrationService.extractTrackIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a'))!;
				expect(releaseIllustrationPath).toBe('test/assets/metadata/my-artist/my-album/my-album-1/cover.jpg');
				expect(fs.existsSync(releaseIllustrationPath)).toBe(true);
				expect(fs.readFileSync(releaseIllustrationPath)).toStrictEqual(Buffer.from('ABCDE'));
			});
			let trackIllustrationPath: string;
			it("should extract illustration to track folder, mocking the illustration bytes", async () => {
				jest.spyOn(IllustrationService.prototype as any, 'extractIllustrationFromFile').mockImplementationOnce(() => 'aaaaa' );
				jest.spyOn(Jimp, 'read').mockImplementationOnce(() => <any>({ getBufferAsync: (_: any) => Buffer.from('ABCDEF') }));
				trackIllustrationPath = (await illustrationService.extractTrackIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a'))!;
				expect(trackIllustrationPath).toBe('test/assets/metadata/my-artist/my-album/my-album-1/disc-1-track-2/cover.jpg');
				expect(fs.existsSync(trackIllustrationPath)).toBe(true);
				expect(fs.readFileSync(trackIllustrationPath)).toStrictEqual(Buffer.from('ABCDEF'));
				expect(fs.existsSync(releaseIllustrationPath)).toBe(true);
				expect(fs.readFileSync(releaseIllustrationPath)).toStrictEqual(Buffer.from('ABCDE'));
				fs.rmSync(releaseIllustrationPath);
				fs.rmSync(trackIllustrationPath);
				
			});

		});
	});
});