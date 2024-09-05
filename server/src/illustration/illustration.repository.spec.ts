import { HttpModule } from "@nestjs/axios";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import ScannerModule from "src/scanner/scanner.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import IllustrationService from "./illustration.service";
import IllustrationModule from "./illustration.module";
import * as fs from "fs";
import TestPrismaService from "test/test-prisma.service";
import { FileDoesNotExistException } from "src/file-manager/file-manager.exceptions";
import { FileParsingException } from "src/scanner/scanner.exceptions";
import ProvidersModule from "src/providers/providers.module";
import IllustrationRepository from "./illustration.repository";
import ScannerService from "src/scanner/scanner.service";

jest.setTimeout(120000);

describe("Illustration Repository", () => {
	let illustrationRepository: IllustrationRepository;
	const baseMetadataFolder = "test/assets/metadata";
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		fs.rm(
			"test/assets/metadata",
			{ recursive: true, force: true },
			() => {},
		);
		module = await createTestingModule({
			imports: [
				HttpModule,
				FileManagerModule,
				IllustrationModule,
				PrismaModule,
				ArtistModule,
				ScannerModule,
				SettingsModule,
				ProvidersModule,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		illustrationRepository = module.get(IllustrationRepository);
		dummyRepository = module.get(PrismaService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
		fs.rm(
			"test/assets/metadata",
			{ recursive: true, force: true },
			() => {},
		);
	});

	describe("Register Track illustration", () => {
		const outPath = `${baseMetadataFolder}/illustration.jpg`;
		it("should not extract illustration to matching folder, as the source file does not exist", async () => {
			const test = () =>
				illustrationRepository.registerTrackIllustration(
					dummyRepository.trackA1_1,
					"trololol",
				);
			return expect(test()).rejects.toThrow(FileDoesNotExistException);
		});

		it("should not extract illustration to matching folder, as the source file is not valid", async () => {
			const test = () =>
				illustrationRepository.registerTrackIllustration(
					dummyRepository.trackA1_1,
					"test/assets/settings.json",
				);
			return expect(test()).rejects.toThrow(FileParsingException);
		});

		it("should not extract illustration to matching folder, as illustration already exists", async () => {
			await illustrationRepository.registerTrackIllustration(
				dummyRepository.trackA1_1,
				"test/assets/dreams.m4a",
			);
			expect(fs.existsSync(outPath)).toBe(false);
			expect(
				await illustrationRepository.getReleaseIllustrationResponse({
					id: dummyRepository.releaseA1_1.id,
				}),
			).toBe(null);
			expect(
				await illustrationRepository.getTrackIllustration({
					id: dummyRepository.trackA1_1.id,
				}),
			).toBe(null);
		});

		it("should not extract illustration to matching folder, as their is no embedded illustration", async () => {
			await illustrationRepository.registerTrackIllustration(
				dummyRepository.trackA1_1,
				"test/assets/dreams.m4a",
			);
			expect(fs.existsSync(outPath)).toBe(false);
			expect(
				await illustrationRepository.getReleaseIllustrationResponse({
					id: dummyRepository.releaseA1_1.id,
				}),
			).toBe(null);
			expect(
				await illustrationRepository.getTrackIllustration({
					id: dummyRepository.trackA1_1.id,
				}),
			).toBe(null);
		});

		let discIllustrationPath: string;
		it("should extract release/track illustration, mocking the illustration bytes", async () => {
			jest.spyOn(
				ScannerService.prototype as any,
				"extractIllustrationFromFile",
			).mockImplementation(() =>
				fs.readFileSync("test/assets/cover.jpg"),
			);
			jest.spyOn(
				IllustrationService.prototype,
				"getImageStats",
			).mockImplementation(async () => ({
				blurhash: "",
				colors: [],
				aspectRatio: 0,
			}));

			const createdIllustration =
				await illustrationRepository.registerTrackIllustration(
					dummyRepository.trackA1_1,
					"test/assets/dreams.m4a",
				);
			discIllustrationPath = `test/assets/metadata/${
				createdIllustration!.id
			}/cover.jpg`;
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			expect(fs.readFileSync(discIllustrationPath)).toStrictEqual(
				fs.readFileSync("test/assets/cover.jpg"),
			);
		});

		let trackIllustrationPath: string = "";
		it("should extract track illustration, mocking the illustration bytes", async () => {
			jest.spyOn(
				ScannerService.prototype as any,
				"extractIllustrationFromFile",
			).mockImplementation(() =>
				fs.readFileSync("test/assets/cover1.jpg"),
			);
			jest.spyOn(
				IllustrationService.prototype,
				"getImageStats",
			).mockImplementation(async () => ({
				blurhash: "A",
				colors: [],
				aspectRatio: 0,
			}));
			const createdIllustration =
				await illustrationRepository.registerTrackIllustration(
					dummyRepository.trackA1_1,
					"test/assets/dreams.m4a",
				);
			trackIllustrationPath = `test/assets/metadata/${
				createdIllustration!.id
			}/cover.jpg`;
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			expect(fs.existsSync(trackIllustrationPath)).toBe(true);
		});
		it("should re-extract illustration to track folder, mocking the illustration bytes", async () => {
			jest.spyOn(
				ScannerService.prototype as any,
				"extractIllustrationFromFile",
			).mockImplementation(() =>
				fs.readFileSync("test/assets/cover2.jpg"),
			);
			jest.spyOn(
				IllustrationService.prototype,
				"getImageStats",
			).mockImplementation(async () => ({
				blurhash: "B",
				colors: [],
				aspectRatio: 0,
			}));
			const createdIllustration =
				await illustrationRepository.registerTrackIllustration(
					dummyRepository.trackA1_1,
					"test/assets/dreams.m4a",
				);
			expect(fs.existsSync(trackIllustrationPath)).toBe(false);
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			trackIllustrationPath = `test/assets/metadata/${
				createdIllustration!.id
			}/cover.jpg`;

			expect(fs.existsSync(trackIllustrationPath)).toBe(true);
		});
	});
});
