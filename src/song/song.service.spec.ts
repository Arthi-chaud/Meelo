import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import SongService from "src/song/song.service";
import ArtistService from "src/artist/artist.service";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import PrismaService from "src/prisma/prisma.service";
import type { Song } from "src/prisma/models";
import Slug from "src/slug/slug";
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from "./song.exceptions";
import { ArtistNotFoundByIDException, ArtistNotFoundException } from "src/artist/artist.exceptions";
import TrackModule from "src/track/track.module";
import AlbumModule from "src/album/album.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import { GenreNotFoundByIdException } from "src/genre/genre.exceptions";
import TestPrismaService from "test/test-prisma.service";
import type SongQueryParameters from "./models/song.query-params";
import { LyricsModule } from "src/lyrics/lyrics.module";

describe('Song Service', () => {
	let songService: SongService;
	let dummyRepository: TestPrismaService;
	let artistService: ArtistService;

	let newSong: Song;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule, LyricsModule],
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
			newSong = await songService.create({
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
			const test = async () => await songService.create({
				name: 'My Song',
				artist: { slug: new Slug(dummyRepository.artistA.name) },
				genres: []
			});

			expect(test()).rejects.toThrow(SongAlreadyExistsException);
		});

		it("should throw, as the parent artist does not exist (by Id)", async () => {
			const test = async () => await songService.create({
				name: 'My Song',
				artist: { id: -1 },
				genres: []
			});

			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw, as the genre does not exist a new song", async () => {
			const test = async () => await songService.create({
				name: 'My Other Song',
				artist: { id: dummyRepository.artistC.id },
				genres: [{ id: -1 }]
			});

			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});

		it("should throw, as the parent artist does not exist (by slug)", async () => {
			const test = async () => await songService.create({
				name: 'My Song',
				artist: { slug: new Slug("trololol") },
				genres: []
			});

			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Get Song", () => {
		it("should retrieve the song (by Slug)", async () => {
			const retrievedSong = await songService.get({
				bySlug: {
					slug: new Slug('My Song'),
					artist: { slug: new Slug(dummyRepository.artistA.name) }
				},
			});

			expect(retrievedSong).toStrictEqual(dummyRepository.songA1);
		});

		it("should retrieve the song (by Id)", async () => {
			const retrievedSong = await songService.get({
				byId: { id: dummyRepository.songA2.id },
			});

			expect(retrievedSong).toStrictEqual(dummyRepository.songA2);
		});

		it("should retrieve the song (w/ include)", async () => {
			const retrievedSong = await songService.get(
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

		it(('should return an existing song, without only its id and slug'), async () => {
			const song = await songService.select({ byId: { id: dummyRepository.songA1.id }}, { slug: true, id: true });
			expect(song).toStrictEqual({ id: dummyRepository.songA1.id, slug: dummyRepository.songA1.slug});
		});

		it("should throw, as the song does not exist (on select)", async () => {
			const test = async () => await songService.select({
				byId: { id: -1 }
			}, { id: true });

			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the song does not exist (by Id)", async () => {
			const test = async () => await songService.get({
				byId: { id: -1 }
			});

			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the song does not exist (by Slug)", async () => {
			const test = async () => await songService.get({
				bySlug: { slug: new Slug('I dont exist'), artist: { id: dummyRepository.artistA.id }},
			});

			expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw, as the parent artist does not exist", async () => {
			const test = async () => await songService.get({
				bySlug: { slug: new Slug('My Slug'), artist: { id: -1 }},
			});

			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});
	});

	describe('Get Multiple Songs', () => {
		it('should get all the songs', async () => {
			const songs = await songService.getMany({ });

			expect(songs.length).toBe(5);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songA2);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(dummyRepository.songC1);
			expect(songs).toContainEqual(newSong);
		});
		
		it('should get the songs from the artist (1 expected)', async () => {
			const songs = await songService.getMany({ 
				artist: { id: dummyRepository.artistB.id }
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(dummyRepository.songB1);
		});

		it('should get the songs from the artist (2 expected)', async () => {
			const songs = await songService.getMany({ 
				artist: { id: dummyRepository.artistA.id }
			});

			expect(songs.length).toBe(3);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songA2);
			expect(songs).toContainEqual(newSong);
		});

		it('should get the two songs, sorted by name (desc)', async () => {
			const songs = await songService.getMany({ 
				artist: { id: dummyRepository.artistA.id }
			}, {}, {}, { sortBy: 'name', order: 'desc' });

			expect(songs.length).toBe(3);
			expect(songs[0]).toStrictEqual(newSong);
			expect(songs[1]).toStrictEqual(dummyRepository.songA1);
			expect(songs[2]).toStrictEqual(dummyRepository.songA2);
		});

		it('should get none, as the artist does not exist', async () => {
			const songs = await songService.getMany({ 
				artist: { id: -1 }
			});

			expect(songs.length).toBe(0);
		});

		it('should get the song by name (starts with)', async () => {
			const songs = await songService.getMany({ 
				name: { startsWith: "My S" }
			});

			expect(songs.length).toBe(3);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(newSong);
		});

		it('should get the song by name (ends with)', async () => {
			const songs = await songService.getMany({ 
				name: { endsWith: " 3" }
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(newSong);
		});
	});

	describe("Count Songs", () => {
		it("should get the number of song by the artist (3 expected)", async () => {
			const songCount = await songService.count({
				artist: { id: dummyRepository.artistA.id }
			});

			expect(songCount).toBe(3);
		});

		it("should get the number of song by the artist (& expected)", async () => {
			const songCount = await songService.count({
				artist: { id: dummyRepository.artistB.id }
			});

			expect(songCount).toBe(1);
		});

		it("should get the number of song with name equal", async () => {
			const songCount = await songService.count({
				name: { is: "My Other Song" },
			});

			expect(songCount).toBe(1);
		});
	});

	describe("Update Song", () => {
		it("should update the play count of the song", async () => {
			const updatedSong = await songService.update(
				{ playCount: 3 }, { byId: { id: dummyRepository.songA1.id } }
			);

			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.playCount).toBe(3);
			expect(updatedSong.artistId).toBe(dummyRepository.artistA.id)
		});

		it("should change the artist of the song", async () => {
			let updatedSong = await songService.update(
				{ artist: { slug: new Slug(dummyRepository.artistB.slug) } },
				{ bySlug: { slug: new Slug(dummyRepository.songA1.slug), artist: { id: dummyRepository.artistA.id }} }
			);

			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.artistId).toBe(dummyRepository.artistB.id);
			updatedSong = await songService.update(
				{ artist: { id: dummyRepository.artistA.id } },
				{ byId: { id: dummyRepository.songA1.id } }
			);
			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.artistId).toBe(dummyRepository.artistA.id);
		});

		it("should change the genres of the song", async () => {
			const updatedSong = await songService.update(
				{ genres: [ { id: dummyRepository.genreA.id }, { id: dummyRepository.genreB.id } ] },
				{ byId: { id: dummyRepository.songA2.id } }
			);

			expect(updatedSong.id).toBe(dummyRepository.songA2.id);
			const refreshedSong = await songService.get({ byId: { id:  dummyRepository.songA2.id } }, { genres: true });
			expect(refreshedSong.genres).toStrictEqual([  dummyRepository.genreA,  dummyRepository.genreB ])
		});

		it("should throw as the song does not exist (by Id)", async () => {
			const test = async () => await songService.update(
				{ name: "Tralala" },
				{ byId: { id: -1 }}
			);
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw as the song does not exist (unknown artist)", async () => {
			const test = async () => await songService.update(
				{ name: "Tralala" },
				{ bySlug: { slug: new Slug("My Song"), artist: { id: -1 } }}
			);
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw as the song does not exist", async () => {
			const test = async () => await songService.update(
				{ name: "Tralala" },
				{ bySlug: { slug: new Slug("My Song"), artist: { id: dummyRepository.artistB.id } }}
			);
			expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw as the genre does not exist", async () => {
			const test = async () => await songService.update(
				{ genres: [ { id: -1 } ] },
				{ bySlug: { slug: new Slug("My Song"), artist: { id: dummyRepository.artistA.id } }}
			);
			expect(test()).rejects.toThrow(GenreNotFoundByIdException);
		});
	});

	describe("Get Song's Versions", () => {
		it("should return the song's versions", async () => {
			const version = await songService.create({ name: 'My Other Song (Remix)', artist: { id: dummyRepository.artistA.id }, genres: [] })
			const versions = await songService.getSongVersions({ byId: { id: dummyRepository.songA2.id }});
			expect(versions).toStrictEqual([
				dummyRepository.songA2,
				version
			]);
			await songService.delete({ id: version.id });
		});
		it("should throw, as the song song does not exist", async () => {
			const test = async () => await songService.getSongVersions({ byId: { id: -1 }});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
	});

	describe("Increment a song's play count", () => {
		it("should throw, as the song does not exist", () => {
			const test = async () => await songService.incrementPlayCount(
				{ byId: { id: -1 } }
			);
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
		it("should increment the song's play count (by id)", async () => {
			const queryParemeters = { byId: { id: dummyRepository.songA2.id } };
			await songService.incrementPlayCount(queryParemeters);
			const updatedSong = await songService.get(queryParemeters);
			expect(updatedSong).toStrictEqual({
				...dummyRepository.songA2,
				playCount: dummyRepository.songA2.playCount + 1
			});
		});

		it("should increment the song's play count (by slug)", async () => {
			const queryParemeters: SongQueryParameters.WhereInput = {
				bySlug:{
					slug: new Slug(dummyRepository.songB1.slug),
					artist: { id: dummyRepository.artistB.id }
				}
			};
			await songService.incrementPlayCount(queryParemeters);
			const updatedSong = await songService.get(queryParemeters);
			expect(updatedSong).toStrictEqual({
				...dummyRepository.songB1,
				playCount: dummyRepository.songB1.playCount + 1
			});
		});
	});

	describe("Get or Create Song", () => {
		it("should get the song", async () => {
			const fetchedSong = await songService.getOrCreate({
				...dummyRepository.songA1,
				artist: { id: dummyRepository.artistA.id },
				genres: []
			});
			expect(fetchedSong.id).toStrictEqual(dummyRepository.songA1.id);
			expect(fetchedSong.slug).toStrictEqual(dummyRepository.songA1.slug);
			expect(fetchedSong.name).toStrictEqual(dummyRepository.songA1.name);
		});

		it("should create the song", async () => {
			const createdSong = await songService.getOrCreate({
				name: "My Song 4", artist: { id: dummyRepository.artistB.id },
				genres: []
			});
			expect(createdSong.name).toBe("My Song 4")
			expect(createdSong.artistId).toBe(dummyRepository.artistB.id);
		});

		it("should throw as the parent artist does not exist ", async () => {
			const test = async () => await songService.getOrCreate({
				name: "My Song 3", artist: { slug: new Slug("My Slug") },
				genres: []
			});
			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Delete Song", () => {
		it("should delete the song (by id)", async () => {
			await songService.delete({ id: dummyRepository.songC1.id });

			const test = async () => await songService.get({ byId: { id: dummyRepository.songC1.id } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should have deleted the parent artist", async () => {
			const test = async () => await artistService.delete({ id :dummyRepository.artistC.id });
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw, as the song song does not exist", async () => {
			const test = async () => await songService.delete({ id: -1 });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
	});
});