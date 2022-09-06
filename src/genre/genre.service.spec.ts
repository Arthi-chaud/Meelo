import type { TestingModule } from "@nestjs/testing";
import type { Genre } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { SongNotFoundByIdException } from "src/song/song.exceptions";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { GenreAlreadyExistsException, GenreNotFoundByIdException, GenreNotFoundException } from "./genre.exceptions";
import GenreModule from "./genre.module";
import GenreService from "./genre.service";

describe("Genre Service", () => {
	let genreService: GenreService;
	let songService: SongService;
	let dummyRepository: TestPrismaService;

	let newGenre: Genre;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule, LyricsModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		songService = module.get<SongService>(SongService);
		dummyRepository = module.get(PrismaService);
		genreService = module.get<GenreService>(GenreService);
		await dummyRepository.onModuleInit();
	});

	describe("Create Genre", () => {
		it("should create a new genre", async () => {
			newGenre = await genreService.create({ name: 'My New Genre' });

			expect(newGenre.id).toBeDefined();
			expect(newGenre.name).toBe("My New Genre");
			expect(newGenre.slug).toBe("my-new-genre");
		});

		it("should throw, as the genre already exists", async () => {
			const test = async () => await genreService.create({ name: dummyRepository.genreA.name });
			expect(test()).rejects.toThrow(GenreAlreadyExistsException);
		});
	});

	describe("Get Genre", () => {
		it("should get the genre by its slug", async () => {
			const fetchedGenre = await genreService.get({ slug: new Slug(dummyRepository.genreB.slug) });

			expect(fetchedGenre).toStrictEqual(dummyRepository.genreB);
		});

		it("should get the genre by its id", async () => {
			const fetchedGenre = await genreService.get({  id: dummyRepository.genreC.id });

			expect(fetchedGenre).toStrictEqual(dummyRepository.genreC);
		});

		it(('should return an existing genre, without only its id and slug'), async () => {
			let genre = await genreService.select({  id: dummyRepository.genreC.id }, { slug: true, id: true });
			expect(genre).toStrictEqual({ id: dummyRepository.genreC.id, slug: dummyRepository.genreC.slug});
		});

		it(('should throw, as the genre does not exist (on select)'), async () => {
			const test = async () => await genreService.select({ slug: new Slug("trololol") }, { id: true });
			expect(test()).rejects.toThrow(GenreNotFoundException);
		});

		it("should throw, as the genre does not exist (by slug)", async () => {
			const test = async () => await genreService.get({ slug: new Slug("trololol") });
			expect(test()).rejects.toThrow(GenreNotFoundException);
		});

		it("should throw, as the genre does not exist (by id)", async () => {
			const test = async () => await genreService.get({ id: -1 });
			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Get Genres", () => {
		it("should get all the the genres", async () => {
			const fetchedGenres = await genreService.getMany({ });

			expect(fetchedGenres.length).toBe(4);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreA);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreC);
			expect(fetchedGenres).toContainEqual(newGenre);
		});

		it("should get all the the genres, sorted by name, desc", async () => {
			const fetchedGenres = await genreService.getMany({}, {}, {}, { sortBy: 'name', order: 'desc' });

			expect(fetchedGenres.length).toBe(4);
			expect(fetchedGenres[0]).toStrictEqual(newGenre);
			expect(fetchedGenres[1]).toStrictEqual(dummyRepository.genreC);
			expect(fetchedGenres[2]).toStrictEqual(dummyRepository.genreB);
			expect(fetchedGenres[3]).toStrictEqual(dummyRepository.genreA);
		});
		it("should get the genres by their names (starts with)", async () => {
			const fetchedGenres = await genreService.getMany({
				byName: { startsWith: 'My Genre' }
			});

			expect(fetchedGenres.length).toBe(3);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreA);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreC);
		});

		it("should get the genres by their names (ends with)", async () => {
			const fetchedGenres = await genreService.getMany({
				byName: { endsWith: 'Genre' }
			});

			expect(fetchedGenres).toStrictEqual([ newGenre ]);
		});

		it("should get the genres by the song (two expected)", async () => {
			await songService.update({
				genres: [ { id: newGenre.id }, { id: dummyRepository.genreA.id } ] },
				{ byId: { id: dummyRepository.songA1.id } }
			);
			const fetchedGenres = await genreService.getMany({
				bySong: { byId: { id: dummyRepository.songA1.id } }
			});

			expect(fetchedGenres.length).toBe(2);
			expect(fetchedGenres).toContainEqual(newGenre);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreA);
		});
		
		it("should get the genres by the song (one expected)", async () => {
			const fetchedGenres = await genreService.getMany({
				bySong: { byId: { id: dummyRepository.songA2.id } }
			});

			expect(fetchedGenres.length).toBe(1);
			expect(fetchedGenres).toContainEqual(dummyRepository.genreB);
		});
	});

	describe("Count Genres", () => {
		it("should get the genres by the song (two expected)", async () => {
			const genresCounts = await genreService.count({
				bySong: { byId: { id: dummyRepository.songA1.id } }
			});

			expect(genresCounts).toBe(2);
		});

		it("should get the genres by their names", async () => {
			const genresCounts = await genreService.count({
				byName: { endsWith: 'B' }
			});

			expect(genresCounts).toBe(1);
		});
	});

	describe("Get or Create Genre", () => {
		it("should get the genre", async () => {
			const fetchedGenre = await genreService.getOrCreate({ name: newGenre.name });

			expect(fetchedGenre).toStrictEqual(newGenre);
		});

		it("should create the genre", async () => {
			let otherGenre = await genreService.getOrCreate({ name: 'My New Genre 2' });

			expect(otherGenre.id).not.toBe(newGenre);
			expect(otherGenre.id).not.toBe(dummyRepository.genreA);
			expect(otherGenre.id).not.toBe(dummyRepository.genreB);
			expect(otherGenre.id).not.toBe(dummyRepository.genreC);
		});
	});

	describe("Update Genre", () => {
		it("should update the genre", async () => {
			const updatedGenre = await genreService.update({ name: 'My New Genre 1' }, { id: newGenre.id });

			expect(updatedGenre.id).toStrictEqual(newGenre.id);
			expect(updatedGenre.slug).toStrictEqual('my-new-genre-1');
			expect(updatedGenre.name).toStrictEqual('My New Genre 1');
		});

		it("should throw, as the genre does not exist", async () => {
			const test = async () => await genreService.update({ name: 'a' }, { id: -1 });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Get Song's genres", () => {
		it("should throw, as the genre does not exist", () => {
			const test = async () => await genreService.getSongGenres({ byId: { id: -1 } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
		it("should find the song's genres", async () => {
			const genres = await genreService.getSongGenres({ byId: { id: dummyRepository.songC1.id } });
			expect(genres).toStrictEqual([dummyRepository.genreC]);
		});
	});

	describe("Delete Genre", () => {
		it("should delete the genre", async () => {
			await genreService.delete({ id: dummyRepository.genreA.id });
		
			const test = async () => await genreService.get({ id: dummyRepository.genreA.id });
			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});

		it('should have removed it from the song', async () => {
			const genres = await genreService.count({ bySong: { byId: { id: dummyRepository.songA1.id } } });

			expect(genres).toBe(1);
		});

		it("should throw, as the genre does not exist", async () => {
			const test = async () => await genreService.delete({ id: -1 });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Delete Genre if empty", () => {
		
		it("should have deletes the genre, because it is not empty", async () => {
			await songService.delete({ byId: { id: dummyRepository.songC1.id } });
		
			const test = async () => await genreService.delete({ id: dummyRepository.genreC.id });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
		it("should not delete the genre, because it is not empty", async () => {
			await genreService.deleteIfEmpty({ id: dummyRepository.genreB.id });
		
			const fetchedGenre = await genreService.get({ id: dummyRepository.genreB.id });
			expect(fetchedGenre).toStrictEqual(dummyRepository.genreB);
		});

		it("should throw, as the genre does not exist", async () => {
			const test = async () => await genreService.deleteIfEmpty({ id: -1 });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});


});