import { HttpModule } from "@nestjs/axios";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import ScannerModule from "src/scanner/scanner.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import IllustrationService from "./illustration.service";
import IllustrationModule from "./illustration.module";
import * as fs from "fs";
import TestPrismaService from "test/test-prisma.service";
import ProvidersModule from "src/providers/providers.module";

jest.setTimeout(120000);

describe("Illustration Service", () => {
	let illustrationService: IllustrationService;
	let releaseService: ReleaseService;
	let albumService: AlbumService;
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
		illustrationService =
			module.get<IllustrationService>(IllustrationService);
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
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

	it("should be defined", () => {
		expect(albumService).toBeDefined();
		expect(illustrationService).toBeDefined();
		expect(releaseService).toBeDefined();
	});

	describe("Build Illustration paths", () => {
		describe("Illustration extraction", () => {
			const outPath = `${baseMetadataFolder}/illustration.jpg`;
			it("should write data to file", async () => {
				if (fs.existsSync(outPath)) fs.rmSync(outPath);
				illustrationService["saveIllustration"](
					Buffer.from("ABC"),
					outPath,
				);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(
					Buffer.from("ABC"),
				);
			});
			it("should re-write data to file", async () => {
				illustrationService["saveIllustration"](
					Buffer.from("ABCDE"),
					outPath,
				);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(
					Buffer.from("ABCDE"),
				);
			});
		});
	});
});
