import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import IllustrationModule from "src/illustration/illustration.module";
import LibraryModule from "src/library/library.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import type { Genre } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import Slug from "src/slug/slug";
import SongModule from "src/song/song.module";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { GenreNotFoundException } from "./genre.exceptions";
import GenreModule from "./genre.module";
import GenreService from "./genre.service";

describe("Genre Service", () => {
	let genreService: GenreService;
	let songService: SongService;
	let dummyRepository: TestPrismaService;

	let newGenre: Genre;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				LibraryModule,
				IllustrationModule,
				ParserModule,
				ArtistModule,
				TrackModule,
				AlbumModule,
				SongModule,
				GenreModule,
				LyricsModule,
				ReleaseModule,
			],
			providers: [SongService, ArtistService, PrismaService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		songService = module.get<SongService>(SongService);
		dummyRepository = module.get(PrismaService);
		genreService = module.get<GenreService>(GenreService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	describe("Create Genre", () => {
		it("should create a new genre", async () => {
			newGenre = await genreService.getOrCreate({ name: "My New Genre" });

			expect(newGenre.id).toBeDefined();
			expect(newGenre.name).toBe("My New Genre");
			expect(newGenre.slug).toBe("my-new-genre");
		});
	});

	describe("Get an album's genres", () => {
		it("should find and sort the genres", async () => {
			const genres = await genreService.getMany(
				{ album: { id: dummyRepository.albumA1.id } },
				{ order: "desc", sortBy: "name" },
				undefined,
				{},
			);
			expect(genres).toStrictEqual([
				dummyRepository.genreB,
				dummyRepository.genreA,
			]);
		});
	});

	describe("Get Genre", () => {
		it("should get the genre by its slug", async () => {
			const fetchedGenre = await genreService.get({
				slug: new Slug(dummyRepository.genreB.slug),
			});

			expect(fetchedGenre).toStrictEqual(dummyRepository.genreB);
		});

		it("should get the genre by its id", async () => {
			const fetchedGenre = await genreService.get({
				id: dummyRepository.genreC.id,
			});

			expect(fetchedGenre).toStrictEqual(dummyRepository.genreC);
		});

		it("should throw, as the genre does not exist (by slug)", async () => {
			const test = async () =>
				await genreService.get({ slug: new Slug("trololol") });
			return expect(test()).rejects.toThrow(GenreNotFoundException);
		});

		it("should throw, as the genre does not exist (by id)", async () => {
			const test = async () => await genreService.get({ id: -1 });
			return expect(test()).rejects.toThrow(GenreNotFoundException);
		});
	});

	describe("Get Genres", () => {
		it("should get all the the genres", async () => {
			const fetchedGenres = await genreService.getMany({});

			expect(fetchedGenres.length).toBe(4);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreA);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreC);
			expect(fetchedGenres).toContainEqual(newGenre);
		});

		it("should get all the the genres, sorted by name, desc", async () => {
			const fetchedGenres = await genreService.getMany(
				{},
				{ sortBy: "name", order: "desc" },
				{},
				{},
			);

			expect(fetchedGenres.length).toBe(4);
			expect(fetchedGenres[0]).toStrictEqual(newGenre);
			expect(fetchedGenres[1]).toStrictEqual(dummyRepository.genreC);
			expect(fetchedGenres[2]).toStrictEqual(dummyRepository.genreB);
			expect(fetchedGenres[3]).toStrictEqual(dummyRepository.genreA);
		});

		it("should get the genres by their names (starts with)", async () => {
			const fetchedGenres = await genreService.getMany({
				slug: { startsWith: "my-genre" },
			});

			expect(fetchedGenres.length).toBe(3);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreA);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreC);
		});

		it("should get the genres by their names (ends with)", async () => {
			const fetchedGenres = await genreService.getMany({
				slug: { endsWith: "genre" },
			});

			expect(fetchedGenres).toStrictEqual([newGenre]);
		});

		it("should get the genres by the song (two expected)", async () => {
			await songService.update(
				{
					genres: [
						{ id: newGenre.id },
						{ id: dummyRepository.genreA.id },
					],
				},
				{ id: dummyRepository.songA1.id },
			);
			const fetchedGenres = await genreService.getMany({
				song: { id: dummyRepository.songA1.id },
			});

			expect(fetchedGenres.length).toBe(3);
			expect(fetchedGenres).toContainEqual(newGenre);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreA);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
		});

		it("should get the genres by the song (one expected)", async () => {
			const fetchedGenres = await genreService.getMany({
				song: { id: dummyRepository.songA2.id },
			});

			expect(fetchedGenres.length).toBe(1);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
		});
	});

	describe("Get or Create Genre", () => {
		it("should get the genre", async () => {
			const fetchedGenre = await genreService.getOrCreate({
				name: newGenre.name,
			});

			expect(fetchedGenre).toStrictEqual(newGenre);
		});

		it("should create the genre", async () => {
			const otherGenre = await genreService.getOrCreate({
				name: "My New Genre 2",
			});

			expect(otherGenre.id).not.toBe(newGenre);
			expect(otherGenre.id).not.toBe(dummyRepository.genreA);
			expect(otherGenre.id).not.toBe(dummyRepository.genreB);
			expect(otherGenre.id).not.toBe(dummyRepository.genreC);
		});
	});

	describe("Get Song's genres", () => {
		it("should find the song's genres", async () => {
			const genres = await genreService.getMany({
				song: { id: dummyRepository.songC1.id },
			});
			expect(genres).toStrictEqual([dummyRepository.genreC]);
		});
	});

	describe("Delete Genre", () => {
		it("should have deleted the genre", async () => {
			const tmpGenre = await genreService.getOrCreate({ name: "12345" });
			await genreService.delete([{ id: tmpGenre.id }]);

			const test = async () =>
				await genreService.get({ id: tmpGenre.id });

			return expect(test()).rejects.toThrow(GenreNotFoundException);
		});
	});
});
