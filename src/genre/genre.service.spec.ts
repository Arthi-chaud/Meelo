import type { TestingModule } from "@nestjs/testing";
import type { Artist, Genre, Song } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { createTestingModule } from "test/TestModule";
import { GenreAlreadyExistsException, GenreNotFoundByIdException, GenreNotFoundException } from "./genre.exceptions";
import GenreModule from "./genre.module";
import GenreService from "./genre.service";

describe("Genre Service", () => {
	let artist: Artist;
	let artist2: Artist;
	let genreService: GenreService;
	let songService: SongService;
	
	let song: Song;
	let song2: Song;

	let genre: Genre;
	let genre2: Genre;
	let genre3: Genre;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		songService = module.get<SongService>(SongService);
		let artistService = module.get<ArtistService>(ArtistService);
		genreService = module.get<GenreService>(GenreService);
		artist = await artistService.createArtist({ name: 'My Artist' });
		artist2 = await artistService.createArtist({ name: 'My Artist 2' });
		song = await songService.createSong({
			name: 'My Artist',
			artist: { id: artist.id },
			genres: []
		});
		song2 = await songService.createSong({
			name: 'My Artist 2',
			artist: { id: artist2.id },
			genres: []
		});
	});

	describe("Create Genre", () => {
		it("should create a new genre", async () => {
			genre = await genreService.createGenre({ name: 'My Genre 1' });

			expect(genre.id).toBeDefined();
			expect(genre.name).toBe("My Genre 1");
			expect(genre.slug).toBe("my-genre-1");
		});

		it("should throw, as the genre already exists", async () => {
			const test = async () => await genreService.createGenre({ name: 'My Genre 1' });
			expect(test()).rejects.toThrow(GenreAlreadyExistsException);
		});

		it("should create a new genre", async () => {
			genre2 = await genreService.createGenre({ name: 'My Genre 2' });

			expect(genre2.id).toBeDefined();
			expect(genre2.name).toBe("My Genre 2");
			expect(genre2.slug).toBe("my-genre-2");
		});
	});

	describe("Get Genre", () => {
		it("should get the genre by its slug", async () => {
			const fetchedGenre = await genreService.getGenre({ slug: new Slug(genre.slug) });

			expect(fetchedGenre).toStrictEqual(genre);
		});

		it("should get the genre by its id", async () => {
			const fetchedGenre = await genreService.getGenre({  id: genre2.id });

			expect(fetchedGenre).toStrictEqual(genre2);
		});

		it("should throw, as the genre does not exist (by slug)", async () => {
			const test = async () => await genreService.getGenre({ slug: new Slug("trololol") });
			expect(test()).rejects.toThrow(GenreNotFoundException);
		});

		it("should throw, as the genre does not exist (by id)", async () => {
			const test = async () => await genreService.getGenre({ id: -1 });
			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Get Genres", () => {
		it("should get all the the genres", async () => {
			const fetchedGenres = await genreService.getGenres({ });

			expect(fetchedGenres.length).toBe(2);
			expect(fetchedGenres).toContainEqual(genre);
			expect(fetchedGenres).toContainEqual(genre2);
		});

		it("should get all the the genres, sorted by name, desc", async () => {
			const fetchedGenres = await genreService.getGenres({}, {}, {}, { sortBy: 'name', order: 'desc' });

			expect(fetchedGenres.length).toBe(2);
			expect(fetchedGenres[0]).toStrictEqual(genre2);
			expect(fetchedGenres[1]).toStrictEqual(genre);
		});
		it("should get the genres by their names (starts with)", async () => {
			const fetchedGenres = await genreService.getGenres({
				byName: { startsWith: 'My Genre' }
			});

			expect(fetchedGenres.length).toBe(2);
			expect(fetchedGenres).toContainEqual(genre);
			expect(fetchedGenres).toContainEqual(genre2);
		});

		it("should get the genres by their names (ends with)", async () => {
			const fetchedGenres = await genreService.getGenres({
				byName: { endsWith: 'Genre 1' }
			});

			expect(fetchedGenres).toStrictEqual([ genre ]);
		});

		it("should get the genres by the song (one expected)", async () => {
			song = await songService.updateSong({ genres: [{ id: genre.id }] }, { byId: { id: song.id } });
			song2 = await songService.updateSong({ genres: [{ id: genre.id }, { id: genre2.id }] }, { byId: { id: song2.id } });
			const fetchedGenres = await genreService.getGenres({
				bySong: { byId: { id: song.id } }
			});

			expect(fetchedGenres).toStrictEqual([ genre ]);
		});

		it("should get the genres by the song (two expected)", async () => {
			const fetchedGenres = await genreService.getGenres({
				bySong: { byId: { id: song2.id } }
			});

			expect(fetchedGenres.length).toBe(2);
			expect(fetchedGenres).toContainEqual(genre);
			expect(fetchedGenres).toContainEqual(genre2);
		});
	});

	describe("Count Genres", () => {
		it("should get the genres by the song (two expected)", async () => {
			const genresCounts = await genreService.countGenres({
				bySong: { byId: { id: song2.id } }
			});

			expect(genresCounts).toBe(2);
		});

		it("should get the genres by their names", async () => {
			const genresCounts = await genreService.countGenres({
				byName: { endsWith: '2' }
			});

			expect(genresCounts).toBe(1);
		});
	});

	describe("Get or Create Genre", () => {
		it("should get the genre", async () => {
			const fetchedGenre = await genreService.getOrCreateGenre({ name: genre.name });

			expect(fetchedGenre).toStrictEqual(genre);
		});

		it("should create the genre", async () => {
			genre3 = await genreService.getOrCreateGenre({ name: 'My Genre 3' });

			expect(genre3).not.toStrictEqual(genre);
			expect(genre3).not.toStrictEqual(genre2);
			expect(genre3.id).toBe(genre2.id + 1);
		});
	});

	describe("Update Genre", () => {
		it("should update the genre", async () => {
			const updatedGenre = await genreService.updateGenre({ name: 'My Genre' }, { id: genre.id });

			expect(updatedGenre.id).toStrictEqual(genre.id);
			expect(updatedGenre.slug).toStrictEqual('my-genre');
			expect(updatedGenre.name).toStrictEqual('My Genre');
		});

		it("should throw, as the genre does not exist", async () => {
			const test = async () => await genreService.updateGenre({ name: 'a' }, { id: -1 });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Delete Genre", () => {
		it("should delete the genre", async () => {
			await genreService.deleteGenre({ id: genre.id });
		
			const fetchedGenres = await genreService.getGenres({});
			expect(fetchedGenres.length).toBe(2);
			expect(fetchedGenres).not.toContainEqual(genre);
		});

		it('should have removed it from the song', async () => {
			const genres = await genreService.countGenres({ bySong: { byId: { id: song2.id } } });

			expect(genres).toBe(1);
		});

		it("should throw, as the genre does not exist", async () => {
			const test = async () => await genreService.deleteGenre({ id: -1 });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Delete Genre if empty", () => {
		it("should delete the genre, because it is empty", async () => {
			await genreService.deleteGenreIfEmpty({ id: genre3.id });
		
			const fetchedGenres = await genreService.getGenres({});
			expect(fetchedGenres.length).toBe(1);
			expect(fetchedGenres).not.toContainEqual(genre3);
		});

		it("should not delete the genre, because it is not empty", async () => {
			await genreService.deleteGenreIfEmpty({ id: genre2.id });
		
			const fetchedGenre = await genreService.getGenre({ id: genre2.id });
			expect(fetchedGenre).toStrictEqual(genre2);
		});

		it("should throw, as the genre does not exist", async () => {
			const test = async () => await genreService.deleteGenreIfEmpty({ id: -1 });

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});


});