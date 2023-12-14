import type { TestingModule } from "@nestjs/testing";
import type { Lyrics } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import Slug from "src/slug/slug";
import { SongNotFoundByIdException } from "src/song/song.exceptions";
import SongModule from "src/song/song.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsAlreadyExistsExceptions, LyricsNotFoundByIDException, LyricsNotFoundBySongException } from "./lyrics.exceptions";
import { LyricsModule } from "./lyrics.module";
import { LyricsService } from "./lyrics.service";
import ProvidersModule from "src/providers/providers.module";

describe('Lyrics Service', () => {
	let dummyRepository: TestPrismaService;
	let lyricsService: LyricsService;
	let lyricsB1: Lyrics;
	let lyricsC1: Lyrics;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PrismaModule, SongModule, AlbumModule, ReleaseModule, FileModule, FileManagerModule, SettingsModule, GenreModule, LyricsModule, ProvidersModule],
			providers: [LyricsService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		dummyRepository = module.get(PrismaService);
		lyricsService = module.get(LyricsService);
	});

	afterAll(() => {
		module.close();
	});

	it('should be defined', () => {
		expect(lyricsService).toBeDefined();
		expect(dummyRepository).toBeDefined();
	});

	describe('Create lyrics', () => {
		it("should create new lyrics", async () => {
			lyricsB1 = await lyricsService.create({
				content: 'AZE',
				songId: dummyRepository.songB1.id,
			});
			expect(lyricsB1.content).toBe('AZE');
			expect(lyricsB1.songId).toBe(dummyRepository.songB1.id);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = () => lyricsService.create({ content: '', songId: -1 });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as lyrics already exists for the lyrics", async () => {
			const test = () => lyricsService.create({ content: '', songId: dummyRepository.songA1.id });
			expect(test()).rejects.toThrow(LyricsAlreadyExistsExceptions);
		});
	});

	describe('Get lyrics', () => {
		it("should throw, as the song does not have lyrics", async () => {
			const test = () => lyricsService.get({ song: { id: dummyRepository.songC1.id }});
			expect(test()).rejects.toThrow(LyricsNotFoundBySongException);
		});

		it("should get the lyrics (by its id)", async () => {
			const fetchedLyrics = await lyricsService.get({ id: dummyRepository.lyricsA1.id });
			expect(fetchedLyrics).toStrictEqual(dummyRepository.lyricsA1);
		});

		it("should get the lyrics (by its song)", async () => {
			const fetchedLyrics = await lyricsService.get({ song: {
				bySlug: { 
					slug: new Slug(dummyRepository.songB1.name),
					artist: {
						slug: new Slug(dummyRepository.artistB.name)
					}
				}
			} });
			expect(fetchedLyrics).toStrictEqual(lyricsB1);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = () => lyricsService.get({ song: { id: -1}});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it(('should return an existing lyric, with only its id'), async () => {
			const lyrics = await lyricsService.select({ id: dummyRepository.lyricsA1.id }, { id: true });
			expect(lyrics).toStrictEqual({ id: dummyRepository.lyricsA1.id});
		});
		it(('should throw, as the lyrics does not exist '), async () => {
			const test = () => lyricsService.select({ id: -1 }, { id: true });
			expect(test()).rejects.toThrow(LyricsNotFoundByIDException);
		});
	});

	describe('Get many lyrics', () => {
		it("should get all lyrics", async () => {
			const allLyrics = await lyricsService.getMany({});
			expect(allLyrics.length).toBe(2);
			expect(allLyrics).toContainEqual(dummyRepository.lyricsA1);
			expect(allLyrics).toContainEqual(lyricsB1);
		});

		it("should shuffle lyrics", async () => {
			const sort1 = await lyricsService.getMany({ }, { take: 10 }, {}, 123);
			const sort2 = await lyricsService.getMany({ }, { take: 10 }, {}, 1234);
			expect(sort1.length).toBe(sort2.length);
			expect(sort1).toContainEqual(dummyRepository.lyricsA1);
			expect(sort1.map(({ id }) => id)).not.toBe(sort2.map(({ id }) => id));
		});
	});
	describe('Count lyrics', () => {
		it("should count", async () => {
			const lyricsCount = await lyricsService.count({});
			expect(lyricsCount).toBe(2);
		});
	});

	describe('Delete lyrics', () => {
		it("should delete the song's lyrics", async () => {
			await lyricsService.delete({ id: lyricsB1.id });
			const test = () => lyricsService.get({ id: lyricsB1.id});
			expect(test()).rejects.toThrow(LyricsNotFoundByIDException);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = () => lyricsService.get({ song: { id: -1}});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the song does not have lyrics", async () => {
			const test = () => lyricsService.get({ song: { id: dummyRepository.songC1.id }});
			expect(test()).rejects.toThrow(LyricsNotFoundBySongException);
		});
	});

	describe('Get or Create lyrics', () => {
		it("should get the lyrics", async () => {
			const fetchedLyrics = await lyricsService.getOrCreate({ content: 'BLA', songId: dummyRepository.songA1.id });
			expect(fetchedLyrics).toStrictEqual(dummyRepository.lyricsA1);
		});
		it("should create new lyrics", async () => {
			lyricsC1 = await lyricsService.getOrCreate({ content: 'BLA', songId: dummyRepository.songC1.id });
			expect(lyricsC1.content).toStrictEqual('BLA');
			expect(lyricsC1.songId).toStrictEqual(dummyRepository.songC1.id);
		});
		it("should throw, as the song does not exist", async () => {
			const test = () => lyricsService.getOrCreate({ content: 'BLA', songId: -1 });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
	});

});