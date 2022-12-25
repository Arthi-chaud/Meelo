import type { TestingModule } from "@nestjs/testing";
import type { Lyrics } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import Slug from "src/slug/slug";
import { SongNotFoundByIdException } from "src/song/song.exceptions";
import SongModule from "src/song/song.module";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsAlreadyExistsExceptions, LyricsNotFoundByIDException, LyricsNotFoundBySongException, NoLyricsFoundException } from "./lyrics.exceptions";
import { LyricsModule } from "./lyrics.module";
import { LyricsService } from "./lyrics.service";

describe('Lyrics Service', () => {
	let dummyRepository: TestPrismaService;
	let lyricsService: LyricsService;
	let lyricsB1: Lyrics;
	let lyricsC1: Lyrics;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, SongModule, AlbumModule, ReleaseModule, FileModule, FileManagerModule, SettingsModule, GenreModule, LyricsModule],
			providers: [LyricsService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		dummyRepository = module.get(PrismaService);
		lyricsService = module.get(LyricsService);
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

		it("should throw, as the song does not have lyrics", async () => {
			const test = () => lyricsService.get({ song: { id: dummyRepository.songC1.id}});
			expect(test()).rejects.toThrow(LyricsNotFoundBySongException);
		});

		it(('should return an existing lyric, without only its id'), async () => {
			const lyrics = await lyricsService.select({ id: dummyRepository.lyricsA1.id }, { id: true });
			expect(lyrics).toStrictEqual({ id: dummyRepository.lyricsA1.id});
		});
		it(('should throw, as the album does not exist '), async () => {
			const test = () => lyricsService.select({ id: -1 }, { id: true });
			expect(test()).rejects.toThrow(LyricsNotFoundByIDException);
		});
	});

	describe('Get many lyrics', () => {
		it("should throw, as the method is not implemented", async () => {
			const allLyrics = await lyricsService.getMany({});
			expect(allLyrics.length).toBe(2);
			expect(allLyrics).toContainEqual(dummyRepository.lyricsA1);
			expect(allLyrics).toContainEqual(lyricsB1);
		});
	});
	describe('Count lyrics', () => {
		it("should throw, as the method is not implemented", async () => {
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
			const test = () => lyricsService.get({ song: { id: dummyRepository.songC1.id}});
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

	describe('Register lyrics', () => {
		it("should not register lyrics, as they already exists", async () => {
			const spy = jest.spyOn(lyricsService, 'downloadLyrics').mockImplementation(async () => '');
			await lyricsService.registerLyrics({ id: dummyRepository.songA1.id }, { force: false });
			const fetchedLyrics = await lyricsService.get({ song: { id: dummyRepository.songA1.id }});
			expect(fetchedLyrics).toStrictEqual(dummyRepository.lyricsA1);
			expect(fetchedLyrics.content).not.toEqual('');
  			spy.mockRestore();
		});
		it("should not register lyrics, as the lyrics download failed", async () => {
			const spy = jest.spyOn(lyricsService, 'downloadLyrics').mockRejectedValue(new NoLyricsFoundException('', ''));
			await lyricsService.registerLyrics({ id: dummyRepository.songA2.id }, { force: false }).catch(() => {});
			expect(() => lyricsService.get({ song: { id: dummyRepository.songA2.id } })).rejects.toThrow();
  			spy.mockRestore();
		});
		it("should create the new lyrics", async () => {
			const spy = jest.spyOn(lyricsService, 'downloadLyrics').mockImplementation(async () => 'NEW LYRICS');
			await lyricsService.registerLyrics({ id: dummyRepository.songB1.id }, { force: false });
			const fetchedLyrics = await lyricsService.get({ song: { id: dummyRepository.songB1.id }});
			expect(fetchedLyrics.content).toBe('NEW LYRICS');
			expect(fetchedLyrics.songId).toBe(dummyRepository.songB1.id);
  			spy.mockRestore();
		});
		it("should refresh the lyrics", async () => {
			const spy = jest.spyOn(lyricsService, 'downloadLyrics').mockImplementation(async () => 'AZERTY');
			await lyricsService.registerLyrics({ id: dummyRepository.songA1.id }, { force: true });
			const fetchedLyrics = await lyricsService.get({ song: { id: dummyRepository.songA1.id }});
			expect(fetchedLyrics).toStrictEqual({
				...dummyRepository.lyricsA1,
				content: 'AZERTY'
			});
  			spy.mockRestore();
		});
	});
});