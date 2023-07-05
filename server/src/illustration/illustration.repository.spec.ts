import { HttpModule } from "@nestjs/axios";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import IllustrationService from "./illustration.service";
import IllustrationModule from "./illustration.module";
import * as fs from 'fs';
import TestPrismaService from "test/test-prisma.service";
import Jimp from 'jimp';
import { FileDoesNotExistException } from "src/file-manager/file-manager.exceptions";
import { FileParsingException } from "src/metadata/metadata.exceptions";
import ProvidersModule from "src/providers/providers.module";
import IllustrationRepository from "./illustration.repository";

jest.setTimeout(120000);

describe('Illustration Repository', () => {
	let illustrationRepository: IllustrationRepository;
	const baseMetadataFolder = 'test/assets/metadata';
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, FileManagerModule, IllustrationModule, PrismaModule, ArtistModule, MetadataModule, SettingsModule, ProvidersModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		illustrationRepository = module.get(IllustrationRepository);
		dummyRepository = module.get(PrismaService);
		
		await dummyRepository.onModuleInit();
	});

	afterAll(() => {
		module.close();
		fs.rm('test/assets/metadata', { recursive: true, force: true }, () => {})
	});

	describe("Register Track illustration", () => {
		const outPath = `${baseMetadataFolder}/illustration.jpg`;
		it("should not extract illustration to matching folder, as the source file does not exist", async () => {
			const test = () => illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'trololol');
			expect(test()).rejects.toThrow(FileDoesNotExistException);
		});

		it("should not extract illustration to matching folder, as the source file is not valid", async () => {
			const test = () => illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'test/assets/settings.json');
			expect(test()).rejects.toThrow(FileParsingException);
		});


		it("should not extract illustration to matching folder, as illustration already exists", async () => {
			await illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a');
			expect(fs.existsSync(outPath)).toBe(false);
			expect(await illustrationRepository.getReleaseIllustration({ id: dummyRepository.releaseA1_1.id })).toBe(null);
			expect(await illustrationRepository.getTrackIllustration({ id: dummyRepository.trackA1_1.id })).toBe(null);
		});

		it("should not extract illustration to matching folder, as their is no embedded illustration", async () => {
			await illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a');
			expect(fs.existsSync(outPath)).toBe(false);
			expect(await illustrationRepository.getReleaseIllustration({ id: dummyRepository.releaseA1_1.id })).toBe(null);
			expect(await illustrationRepository.getTrackIllustration({ id: dummyRepository.trackA1_1.id })).toBe(null);
		});

		let releaseIllustrationPath: string;
		it("should extract illustration to release folder, mocking the illustration bytes", async () => {
			jest.spyOn(IllustrationService.prototype as any, 'extractIllustrationFromFile').mockImplementation(() => 'aaaaa' );
			jest.spyOn(Jimp, 'read').mockImplementation(() => <any>({ getBufferAsync: (_: any) => Buffer.from('ABCDE') }));
			jest.spyOn(IllustrationService.prototype, 'getIllustrationBlurHashAndColors').mockImplementation(async () => ['', []]);
			releaseIllustrationPath = (await illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a'))!;
			expect(releaseIllustrationPath).toBe('test/assets/metadata/my-artist/my-album/my-album-1/cover.jpg');
			expect(fs.existsSync(releaseIllustrationPath)).toBe(true);
			expect(fs.readFileSync(releaseIllustrationPath)).toStrictEqual(Buffer.from('ABCDE'));
		});
		let discIllustrationPath: string;
		it("should extract illustration to disc folder, mocking the illustration bytes", async () => {
			jest.spyOn(IllustrationService.prototype as any, 'extractIllustrationFromFile').mockImplementation(() => Buffer.from('aaaaa') );
			jest.spyOn(Jimp, 'read').mockImplementation(() => <any>({ getBufferAsync: (_: any) => Buffer.from('ABCDEF') }));
			discIllustrationPath = (await illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a'))!;
			expect(discIllustrationPath).toBe('test/assets/metadata/my-artist/my-album/my-album-1/disc-1/cover.jpg');
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			expect(fs.readFileSync(discIllustrationPath)).toStrictEqual(Buffer.from('ABCDEF'));
			expect(fs.existsSync(releaseIllustrationPath)).toBe(true);
			expect(fs.readFileSync(releaseIllustrationPath)).toStrictEqual(Buffer.from('ABCDE'));
			
		});
		let trackIllustrationPath: string;
		it("should extract illustration to track folder, mocking the illustration bytes", async () => {
			jest.spyOn(IllustrationService.prototype as any, 'extractIllustrationFromFile').mockImplementation(() => 'aaaaa' );
			jest.spyOn(Jimp, 'read').mockImplementation(() => <any>({ getBufferAsync: (_: any) => Buffer.from('ABCDEFG') }));
			trackIllustrationPath = (await illustrationRepository.registerTrackFileIllustration(dummyRepository.trackA1_1, 'test/assets/dreams.m4a'))!;
			expect(trackIllustrationPath).toBe('test/assets/metadata/my-artist/my-album/my-album-1/disc-1/track-2/cover.jpg');
			expect(fs.existsSync(trackIllustrationPath)).toBe(true);
			expect(fs.readFileSync(trackIllustrationPath)).toStrictEqual(Buffer.from('ABCDEFG'));
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			expect(fs.readFileSync(discIllustrationPath)).toStrictEqual(Buffer.from('ABCDEF'));
			expect(fs.existsSync(releaseIllustrationPath)).toBe(true);
			expect(fs.readFileSync(releaseIllustrationPath)).toStrictEqual(Buffer.from('ABCDE'));
			fs.rmSync(releaseIllustrationPath);
			fs.rmSync(discIllustrationPath);
			fs.rmSync(trackIllustrationPath);	
		});

	});
});
