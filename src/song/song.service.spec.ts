import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import SongService from "src/song/song.service";
import ArtistService from "src/artist/artist.service";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import PrismaService from "src/prisma/prisma.service";
import type { Artist, Genre, Song } from "@prisma/client";
import Slug from "src/slug/slug";
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from "./song.exceptions";
import { ArtistNotFoundByIDException, ArtistNotFoundException } from "src/artist/artist.exceptions";
import TrackModule from "src/track/track.module";
import AlbumModule from "src/album/album.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import { GenreNotFoundByIdException } from "src/genre/genre.exceptions";
import GenreService from "src/genre/genre.service";

describe('Song Service', () => {
	let artistService: ArtistService;
	let songService: SongService;
	let genreService: GenreService;
	let artist: Artist;
	let artist2: Artist;
	let song: Song & { genres: Genre[] };
	let song2: Song & { genres: Genre[] };
	let genre: Genre;
	let genre2: Genre;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		songService = module.get<SongService>(SongService);
		artistService = module.get<ArtistService>(ArtistService);
		genreService = module.get<GenreService>(GenreService);
		artist = await artistService.createArtist({ name: 'My Artist' });
		artist2 = await artistService.createArtist({ name: 'My Artist 2' });
		genre = await genreService.createGenre({ name: 'My Genre' });
		genre2 = await genreService.createGenre({ name: 'My Genre 2' });
	});

	it('should be defined', () => {
		expect(songService).toBeDefined();
		expect(artistService).toBeDefined();
	});

	describe("Create a song", () => {
		it("should create a new song", async () => {
			song = await songService.createSong({
				name: 'My Song',
				artist: { slug: new Slug(artist.name) },
				genres: [ { id: genre.id }]
			});

			expect(song.id).toBeDefined();
			expect(song.artistId).toBe(artist.id);
			expect(song.name).toBe('My Song');
			expect(song.slug).toBe('my-song');
			expect(song.playCount).toBe(0);
		});

		it("should throw, as a song with the name name from the same artist exists", async () => {
			const test = async () => await songService.createSong({
				name: 'My Song',
				artist: { slug: new Slug(artist.name) },
				genres: []
			});

			expect(test()).rejects.toThrow(SongAlreadyExistsException);
		});

		it("should throw, as the parent artist does not exist (by Id)", async () => {
			const test = async () => await songService.createSong({
				name: 'My Song',
				artist: { id: -1 },
				genres: []
			});

			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw, as the genre does not exist a new song", async () => {
			const test = async () => await songService.createSong({
				name: 'My Other Song',
				artist: { id: 0 },
				genres: [{ id: -1 }]
			});

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});

		it("should throw, as the parent artist does not exist (by slug)", async () => {
			const test = async () => await songService.createSong({
				name: 'My Song',
				artist: { slug: new Slug("trololol") },
				genres: []
			});

			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Get Song", () => {
		it("should retrieve the song (by Slug)", async () => {
			let retrievedSong = await songService.getSong({
				bySlug: {
					slug: new Slug('My Song'),
					artist: { slug: new Slug(artist.name) }
				},
			});

			expect(retrievedSong).toStrictEqual(song);
		});

		it("should retrieve the song (by Id)", async () => {
			let retrievedSong = await songService.getSong({
				byId: { id: song.id },
			});

			expect(retrievedSong).toStrictEqual(song);
		});

		it("should retrieve the song (w/ include)", async () => {
			let retrievedSong = await songService.getSong(
				{ byId: { id: song.id } }, { artist: true, genres: true }
			);

			expect(retrievedSong.artist).toStrictEqual(artist);
			expect(retrievedSong.genres).toStrictEqual([genre]);
		});

		it("should throw, as the song does not exist (by Id)", async () => {
			const test = async () => await songService.getSong({
				byId: { id: -1 }
			});

			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the song does not exist (by Slug)", async () => {
			const test = async () => await songService.getSong({
				bySlug: { slug: new Slug('I dont exist'), artist: { id: artist.id }},
			});

			expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw, as the parent artist does not exist", async () => {
			const test = async () => await songService.getSong({
				bySlug: { slug: new Slug('My Slug'), artist: { id: -1 }},
			});

			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});
	});

	describe('Get Multiple Songs', () => {
		it('should get the two song from the artist', async () => {
			song2 = await songService.createSong({
				name: 'My Song 2',
				artist: { id: artist.id },
				genres: []
			});
			let songs = await songService.getSongs({ 
				artist: { id: artist.id }
			});

			expect(songs.length).toBe(2);
			expect(songs[0]).toStrictEqual(song);
			expect(songs[1]).toStrictEqual(song2);
		});

		it('should get the two songs, sorted by name (desc)', async () => {
			let songs = await songService.getSongs({ 
				artist: { id: artist.id }
			}, {}, {}, { sortBy: 'name', order: 'desc' });

			expect(songs.length).toBe(2);
			expect(songs[0]).toStrictEqual(song2);
			expect(songs[1]).toStrictEqual(song);
		});

		it('should get none, as the artist does not exist', async () => {
			let songs = await songService.getSongs({ 
				artist: { id: -1 }
			});

			expect(songs.length).toBe(0);
		});

		it('should get the song by name (starts with)', async () => {
			let songs = await songService.getSongs({ 
				name: { startsWith: "My" }
			});

			expect(songs.length).toBe(2);
			expect(songs[0]).toStrictEqual(song);
			expect(songs[1]).toStrictEqual(song2);
		});

		it('should get the song by name (ends with)', async () => {
			let songs = await songService.getSongs({ 
				name: { endsWith: " 2" }
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(song2);
		});
	});

	describe("Count Songs", () => {
		it("should get the number of song by the artist", async () => {
			let songCount = await songService.countSongs({
				artist: { id: artist.id }
			});

			expect(songCount).toBe(2);
		});

		it("should get the number of song with name equal", async () => {
			let songCount = await songService.countSongs({
				name: { is: "My Song 2" },
			});

			expect(songCount).toBe(1);
		});
	});

	describe("Update Song", () => {
		it("should update the play count of the song", async () => {
			let updatedSong = await songService.updateSong(
				{ playCount: 3 }, { byId: { id: song.id } }
			);

			expect(updatedSong.id).toBe(song.id);
			expect(updatedSong.playCount).toBe(3);
			expect(updatedSong.artistId).toBe(song.artistId)
		});

		it("should change the artist of the song", async () => {
			let updatedSong = await songService.updateSong(
				{ artist: { slug: new Slug(artist2.slug) } },
				{ bySlug: { slug: new Slug(song2.slug), artistId: artist.id } }
			);

			expect(updatedSong.id).toBe(song2.id);
			expect(updatedSong.artistId).toBe(artist2.id)
		});

		it("should change the genres of the song", async () => {
			let updatedSong = await songService.updateSong(
				{ genres: [ { id: genre.id }, { id: genre2.id } ] },
				{ byId: { id: song2.id } }
			);

			expect(updatedSong.id).toBe(song2.id);
			const refreshedSong = await songService.getSong({ byId: { id: song2.id } }, { genres: true });
			expect(refreshedSong.genres).toStrictEqual([ genre, genre2 ])
		});

		it("should throw as the song does not exist (by Id)", async () => {
			const test = async () => await songService.updateSong(
				{ name: "Tralala" },
				{ byId: { id: -1 }}
			);
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw as the song does not exist (unknown artist)", async () => {
			const test = async () => await songService.updateSong(
				{ name: "Tralala" },
				{ bySlug: { slug: new Slug("My Song"), artistId: -1 }}
			);
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw as the song does not exist", async () => {
			const test = async () => await songService.updateSong(
				{ name: "Tralala" },
				{ bySlug: { slug: new Slug("My Song"), artistId: artist2.id }}
			);
			expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw as the goenre does not exist", async () => {
			const test = async () => await songService.updateSong(
				{ genres: [ { id: -1 } ] },
				{ bySlug: { slug: new Slug("My Song"), artistId: artist2.id }}
			);
			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Get or Create Song", () => {
		it("should get the song", async () => {
			let fetchedSong = await songService.getOrCreateSong({
				...song,
				artist: { id: artist.id },
				genres: []
			});
			expect(fetchedSong.id).toStrictEqual(song.id);
			expect(fetchedSong.slug).toStrictEqual(song.slug);
			expect(fetchedSong.name).toStrictEqual(song.name);
		});

		it("should create the song", async () => {
			let createdSong = await songService.getOrCreateSong({
				name: "My Song 3", artist: { slug: new Slug("My Artist") },
				genres: []
			});
			expect(createdSong.name).toBe("My Song 3")
			expect(createdSong.artistId).toBe(artist.id);
		});

		it("should thorw as the parent artist does not exist ", async () => {
			const test = async () => await songService.getOrCreateSong({
				name: "My Song 3", artist: { slug: new Slug("My Slug") },
				genres: []
			});
			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Delete Song", () => {
		it("should delete the song (by id)", async () => {
			await songService.deleteSong({ byId: { id :song2.id }});

			const test = async () => await songService.getSong({ byId: { id: song2.id } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should delete the song (by slug)", async () => {
			await songService.deleteSong({ bySlug: { slug: new Slug(song.slug), artist: { id: artist.id } }});

			const test = async () => await songService.getSong({ byId: { id: song2.id } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should have deleted the parent artist", async () => {
			const test = async () => await artistService.deleteArtist({ id :artist2.id });
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw, as the song song does not exist (unknown Artist)", async () => {
			const test = async () => await songService.deleteSong({
				bySlug: { slug: new Slug('My Song'), artist: { slug: new Slug("Tralala") } }
			});
			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});

		it("should throw, as the song song does not exist", async () => {
			const test = async () => await songService.deleteSong({
				bySlug: { slug: new Slug('My Song'), artist: { slug: new Slug("My Artist") } }
			});
			expect(test()).rejects.toThrow(SongNotFoundException);
		});
	});
});