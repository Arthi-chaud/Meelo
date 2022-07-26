import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import SongService from "src/song/song.service";
import ArtistService from "src/artist/artist.service";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import PrismaService from "src/prisma/prisma.service";
import type {  Song } from "@prisma/client";
import Slug from "src/slug/slug";
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from "./song.exceptions";
import { ArtistNotFoundByIDException, ArtistNotFoundException } from "src/artist/artist.exceptions";
import TrackModule from "src/track/track.module";
import AlbumModule from "src/album/album.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import { GenreNotFoundByIdException } from "src/genre/genre.exceptions";
import TestPrismaService from "test/test-prisma.service";

describe('Song Service', () => {
	let songService: SongService;
	let dummyRepository: TestPrismaService;
	let artistService: ArtistService;

	let newSong: Song;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		songService = module.get(SongService);
		artistService = module.get(ArtistService);
		await dummyRepository.onModuleInit();
	});

	it('should be defined', () => {
		expect(songService).toBeDefined();
		expect(dummyRepository).toBeDefined();
	});

	describe("Create a song", () => {
		it("should create a new song", async () => {
			newSong = await songService.createSong({
				name: 'My Song 3',
				artist: { slug: new Slug(dummyRepository.artistA.name) },
				genres: [ { id: dummyRepository.genreA.id }, { id: dummyRepository.genreC.id } ]
			});

			expect(newSong.id).toBeDefined();
			expect(newSong.artistId).toBe(dummyRepository.artistA.id);
			expect(newSong.name).toBe('My Song 3');
			expect(newSong.slug).toBe('my-song-3');
			expect(newSong.playCount).toBe(0);
		});

		it("should throw, as a song with the name name from the same artist exists", async () => {
			const test = async () => await songService.createSong({
				name: 'My Song',
				artist: { slug: new Slug(dummyRepository.artistA.name) },
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
					artist: { slug: new Slug(dummyRepository.artistA.name) }
				},
			});

			expect(retrievedSong).toStrictEqual(dummyRepository.songA1);
		});

		it("should retrieve the song (by Id)", async () => {
			let retrievedSong = await songService.getSong({
				byId: { id: dummyRepository.songA2.id },
			});

			expect(retrievedSong).toStrictEqual(dummyRepository.songA2);
		});

		it("should retrieve the song (w/ include)", async () => {
			let retrievedSong = await songService.getSong(
				{ byId: { id: newSong.id } }, { artist: true, genres: true }
			);

			expect(retrievedSong).toStrictEqual({
				...newSong,
				genres: [
					dummyRepository.genreA, dummyRepository.genreC
				],
				artist: dummyRepository.artistA
			});
		});

		it("should throw, as the song does not exist (by Id)", async () => {
			const test = async () => await songService.getSong({
				byId: { id: -1 }
			});

			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the song does not exist (by Slug)", async () => {
			const test = async () => await songService.getSong({
				bySlug: { slug: new Slug('I dont exist'), artist: { id: dummyRepository.artistA.id }},
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
		it('should get all the songs', async () => {
			let songs = await songService.getSongs({ });

			expect(songs.length).toBe(5);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songA2);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(dummyRepository.songC1);
			expect(songs).toContainEqual(newSong);
		});
		
		it('should get the songs from the artist (1 expected)', async () => {
			let songs = await songService.getSongs({ 
				artist: { id: dummyRepository.artistB.id }
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(dummyRepository.songB1);
		});

		it('should get the songs from the artist (2 expected)', async () => {
			let songs = await songService.getSongs({ 
				artist: { id: dummyRepository.artistA.id }
			});

			expect(songs.length).toBe(3);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songA2);
			expect(songs).toContainEqual(newSong);
		});

		it('should get the two songs, sorted by name (desc)', async () => {
			let songs = await songService.getSongs({ 
				artist: { id: dummyRepository.artistA.id }
			}, {}, {}, { sortBy: 'name', order: 'desc' });

			expect(songs.length).toBe(3);
			expect(songs[0]).toStrictEqual(newSong);
			expect(songs[1]).toStrictEqual(dummyRepository.songA1);
			expect(songs[2]).toStrictEqual(dummyRepository.songA2);
		});

		it('should get none, as the artist does not exist', async () => {
			let songs = await songService.getSongs({ 
				artist: { id: -1 }
			});

			expect(songs.length).toBe(0);
		});

		it('should get the song by name (starts with)', async () => {
			let songs = await songService.getSongs({ 
				name: { startsWith: "My S" }
			});

			expect(songs.length).toBe(3);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(newSong);
		});

		it('should get the song by name (ends with)', async () => {
			let songs = await songService.getSongs({ 
				name: { endsWith: " 3" }
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(newSong);
		});
	});

	describe("Count Songs", () => {
		it("should get the number of song by the artist (3 expected)", async () => {
			let songCount = await songService.countSongs({
				artist: { id: dummyRepository.artistA.id }
			});

			expect(songCount).toBe(3);
		});

		it("should get the number of song by the artist (& expected)", async () => {
			let songCount = await songService.countSongs({
				artist: { id: dummyRepository.artistB.id }
			});

			expect(songCount).toBe(1);
		});

		it("should get the number of song with name equal", async () => {
			let songCount = await songService.countSongs({
				name: { is: "My Other Song" },
			});

			expect(songCount).toBe(1);
		});
	});

	describe("Update Song", () => {
		it("should update the play count of the song", async () => {
			let updatedSong = await songService.updateSong(
				{ playCount: 3 }, { byId: { id: dummyRepository.songA1.id } }
			);

			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.playCount).toBe(3);
			expect(updatedSong.artistId).toBe(dummyRepository.artistA.id)
		});

		it("should change the artist of the song", async () => {
			let updatedSong = await songService.updateSong(
				{ artist: { slug: new Slug(dummyRepository.artistB.slug) } },
				{ bySlug: { slug: new Slug(dummyRepository.songA1.slug), artistId: dummyRepository.artistA.id } }
			);

			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.artistId).toBe(dummyRepository.artistB.id);
			updatedSong = await songService.updateSong(
				{ artist: { id: dummyRepository.artistA.id } },
				{ byId: { id: dummyRepository.songA1.id } }
			);
			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.artistId).toBe(dummyRepository.artistA.id);
		});

		it("should change the genres of the song", async () => {
			let updatedSong = await songService.updateSong(
				{ genres: [ { id: dummyRepository.genreA.id }, { id: dummyRepository.genreB.id } ] },
				{ byId: { id: dummyRepository.songA2.id } }
			);

			expect(updatedSong.id).toBe(dummyRepository.songA2.id);
			const refreshedSong = await songService.getSong({ byId: { id:  dummyRepository.songA2.id } }, { genres: true });
			expect(refreshedSong.genres).toStrictEqual([  dummyRepository.genreA,  dummyRepository.genreB ])
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
				{ bySlug: { slug: new Slug("My Song"), artistId:  dummyRepository.artistB.id }}
			);
			expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw as the genre does not exist", async () => {
			const test = async () => await songService.updateSong(
				{ genres: [ { id: -1 } ] },
				{ bySlug: { slug: new Slug("My Song"), artistId:  dummyRepository.artistA.id }}
			);
			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Get or Create Song", () => {
		it("should get the song", async () => {
			let fetchedSong = await songService.getOrCreateSong({
				...dummyRepository.songA1,
				artist: { id: dummyRepository.artistA.id },
				genres: []
			});
			expect(fetchedSong.id).toStrictEqual(dummyRepository.songA1.id);
			expect(fetchedSong.slug).toStrictEqual(dummyRepository.songA1.slug);
			expect(fetchedSong.name).toStrictEqual(dummyRepository.songA1.name);
		});

		it("should create the song", async () => {
			let createdSong = await songService.getOrCreateSong({
				name: "My Song 4", artist: { id: dummyRepository.artistB.id },
				genres: []
			});
			expect(createdSong.name).toBe("My Song 4")
			expect(createdSong.artistId).toBe(dummyRepository.artistB.id);
		});

		it("should throw as the parent artist does not exist ", async () => {
			const test = async () => await songService.getOrCreateSong({
				name: "My Song 3", artist: { slug: new Slug("My Slug") },
				genres: []
			});
			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Delete Song", () => {
		it("should delete the song (by id)", async () => {
			await songService.deleteSong({ byId: { id: dummyRepository.songA1.id }});

			const test = async () => await songService.getSong({ byId: { id: dummyRepository.songA1.id } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should delete the song (by slug)", async () => {
			await songService.deleteSong({
				bySlug: { slug: new Slug(dummyRepository.songC1.slug), artist: { id: dummyRepository.artistC.id } }
			});

			const test = async () => await songService.getSong({ byId: { id: dummyRepository.songC1.id } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should have deleted the parent artist", async () => {
			const test = async () => await artistService.delete({ id :dummyRepository.artistC.id });
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
				bySlug: { slug: new Slug('My Song'), artist: { slug: new Slug(dummyRepository.artistB.slug) } }
			});
			expect(test()).rejects.toThrow(SongNotFoundException);
		});
	});
});