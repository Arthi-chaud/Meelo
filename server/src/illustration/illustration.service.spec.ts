import * as fs from "node:fs";
import { HttpModule } from "@nestjs/axios";
import type { TestingModule } from "@nestjs/testing";
import { Jimp } from "jimp";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import IllustrationModule from "./illustration.module";
import IllustrationService from "./illustration.service";

jest.setTimeout(120000);

describe("Illustration Service", () => {
	let illustrationService: IllustrationService;
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	const baseMetadataFolder = "test/assets/metadata";
	let dummyRepository: TestPrismaService;
	let getBlurhashComponentCountFromAspectRatio: IllustrationService["getBlurhashComponentCountFromAspectRatio"];

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
				ParserModule,
				SettingsModule,
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
		getBlurhashComponentCountFromAspectRatio =
			// biome-ignore lint/complexity/useLiteralKeys: dirty hack
			illustrationService["getBlurhashComponentCountFromAspectRatio"];

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
				illustrationService.saveIllustration(
					Buffer.from("ABC"),
					outPath,
				);
				expect(fs.existsSync(outPath)).toBe(true);
				expect(fs.readFileSync(outPath)).toStrictEqual(
					Buffer.from("ABC"),
				);
			});
			it("should re-write data to file", async () => {
				illustrationService.saveIllustration(
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
	describe("Get Blurhash Components Count", () => {
		it("square image", () => {
			const [x, y] = getBlurhashComponentCountFromAspectRatio(1);
			expect(x).toBe(4);
			expect(y).toBe(4);
		});
		it("(not really) square image", () => {
			const [x, y] = getBlurhashComponentCountFromAspectRatio(1.01);
			expect(x).toBe(4);
			expect(y).toBe(4);
		});
		it("16:9 Thumbnail", () => {
			const [x, y] = getBlurhashComponentCountFromAspectRatio(16 / 9);
			expect(x).toBe(4);
			expect(y).toBe(2);
		});
		it("4:3 Thumbnail", () => {
			const [x, y] = getBlurhashComponentCountFromAspectRatio(4 / 3);
			expect(x).toBe(4);
			expect(y).toBe(3);
		});
		it("DVD Artwork", () => {
			const [x, y] = getBlurhashComponentCountFromAspectRatio(2 / 3);
			expect(x).toBe(3);
			expect(y).toBe(4);
		});
		it("2:1 Artwork", () => {
			const [x, y] = getBlurhashComponentCountFromAspectRatio(2);
			expect(x).toBe(4);
			expect(y).toBe(2);
		});
	});

	describe("Get Illustration Colors", () => {
		it("should return the correct set of colors", async () => {
			const img = fs.readFileSync("test/assets/artwork.jpeg");
			const colorsSet = await illustrationService.getImageColors(
				(await Jimp.read(img)).bitmap.data,
			);
			expect(colorsSet).toEqual([
				"#babc85",
				"#211a11",
				"#a0893e",
				"#736e39",
				"#949c7c",
			]);
		});
	});

	it("can handle big images (#1270)", async () => {
		const img = fs.readFileSync("test/assets/bigcover.jpeg");
		await illustrationService.getImageStats(img);
	});
});
