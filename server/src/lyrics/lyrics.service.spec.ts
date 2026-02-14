import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import FileModule from "src/file/file.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import type { Lyrics } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import { SongNotFoundException } from "src/song/song.exceptions";
import SongModule from "src/song/song.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsNotFoundBySongException } from "./lyrics.exceptions";
import { LyricsModule } from "./lyrics.module";
import { LyricsService } from "./lyrics.service";

describe("Lyrics Service", () => {
	let dummyRepository: TestPrismaService;
	let lyricsService: LyricsService;
	let lyricsB1: Lyrics;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				SongModule,
				AlbumModule,
				ReleaseModule,
				FileModule,
				FileManagerModule,
				SettingsModule,
				GenreModule,
				LyricsModule,
			],
			providers: [LyricsService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		dummyRepository = module.get(PrismaService);
		lyricsService = module.get(LyricsService);
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(lyricsService).toBeDefined();
		expect(dummyRepository).toBeDefined();
	});

	describe("Create lyrics", () => {
		it("should create new lyrics", async () => {
			lyricsB1 = await lyricsService.createOrUpdate({
				plain: "AZE",
				songId: dummyRepository.songB1.id,
			});
			expect(lyricsB1.plain).toBe("AZE");
			expect(lyricsB1.songId).toBe(dummyRepository.songB1.id);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = () =>
				lyricsService.createOrUpdate({ plain: "", songId: -1 });
			return expect(test()).rejects.toThrow(SongNotFoundException);
		});
	});

	describe("Get lyrics", () => {
		it("should throw, as the song does not have lyrics", async () => {
			const test = () =>
				lyricsService.get({ songId: dummyRepository.songC1.id });
			return expect(test()).rejects.toThrow(
				LyricsNotFoundBySongException,
			);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = () => lyricsService.get({ songId: -1 });
			return expect(test()).rejects.toThrow(SongNotFoundException);
		});
	});

	describe("Delete lyrics", () => {
		it("should delete the song's lyrics", async () => {
			await lyricsService.delete({ songId: lyricsB1.songId });
			const test = () => lyricsService.get({ songId: lyricsB1.songId });
			return expect(test()).rejects.toThrow(
				LyricsNotFoundBySongException,
			);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = () => lyricsService.get({ songId: -1 });
			return expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw, as the song does not have lyrics", async () => {
			const test = () =>
				lyricsService.get({ songId: dummyRepository.songC1.id });
			return expect(test()).rejects.toThrow(
				LyricsNotFoundBySongException,
			);
		});
	});
});
