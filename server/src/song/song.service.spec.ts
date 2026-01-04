import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import { ArtistNotFoundException } from "src/artist/artist.exceptions";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import { GenreNotFoundException } from "src/genre/genre.exceptions";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import { LyricsService } from "src/lyrics/lyrics.service";
import ParserModule from "src/parser/parser.module";
import { type Artist, SongType } from "src/prisma/generated/client";
import type { Song } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import Slug from "src/slug/slug";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	SongAlreadyExistsException,
	SongNotEmptyException,
	SongNotFoundException,
} from "./song.exceptions";
import SongModule from "./song.module";

describe("Song Service", () => {
	let songService: SongService;
	let lyricsService: LyricsService;
	let dummyRepository: TestPrismaService;
	let artistService: ArtistService;

	let newSong: Song;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				ArtistModule,
				TrackModule,
				AlbumModule,
				IllustrationModule,
				GenreModule,
				LyricsModule,
				ReleaseModule,
				SongModule,
				ParserModule,
			],
			providers: [SongService, ArtistService, PrismaService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		songService = module.get(SongService);
		artistService = module.get(ArtistService);
		lyricsService = module.get(LyricsService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(songService).toBeDefined();
		expect(dummyRepository).toBeDefined();
	});

	describe("Create a song", () => {
		it("should create a new song", async () => {
			const registeredAt = new Date("2005");
			newSong = await songService.create({
				registeredAt,
				name: "My Song 3",
				artist: { slug: new Slug(dummyRepository.artistA.name) },
				genres: [
					{ id: dummyRepository.genreA.id },
					{ id: dummyRepository.genreC.id },
				],
				group: {
					slug: new Slug(dummyRepository.artistA.name, "my-song-3"),
				},
			});

			expect(newSong.id).toBeDefined();
			expect(newSong.artistId).toBe(dummyRepository.artistA.id);
			expect(newSong.name).toBe("My Song 3");
			expect(newSong.slug).toBe("my-artist-my-song-3");
			expect(newSong.nameSlug).toBe("my-song-3");
			expect(newSong.registeredAt).toStrictEqual(registeredAt);
			expect(newSong.type).toBe(SongType.Original);
		});

		it("should throw, as a song with the name name from the same artist exists", async () => {
			const test = async () =>
				await songService.create({
					name: "My Song",
					artist: { slug: new Slug(dummyRepository.artistA.name) },
					genres: [],
					group: {
						slug: new Slug(dummyRepository.artistA.name, "my-song"),
					},
				});

			return expect(test()).rejects.toThrow(SongAlreadyExistsException);
		});

		it("should throw, as the parent artist does not exist (by Id)", async () => {
			const test = async () =>
				await songService.create({
					name: "My Song",
					artist: { id: -1 },
					genres: [],
					group: {
						slug: new Slug((-1).toString(), "my-song"),
					},
				});

			return expect(test()).rejects.toThrow(ArtistNotFoundException);
		});

		it("should throw, as the genre does not exist a new song", async () => {
			const test = async () =>
				await songService.create({
					name: "My Other Song",
					artist: { id: dummyRepository.artistC.id },
					genres: [{ id: -1 }],
					group: {
						slug: new Slug(
							dummyRepository.artistC.name,
							"my-other-song",
						),
					},
				});

			return expect(test()).rejects.toThrow(GenreNotFoundException);
		});

		it("should throw, as the parent artist does not exist (by slug)", async () => {
			const test = async () =>
				await songService.create({
					name: "My Song",
					artist: { slug: new Slug("trololol") },
					genres: [],
					group: {
						slug: new Slug("trololol", "my-song"),
					},
				});

			return expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Get Song", () => {
		it("should retrieve the song (by Slug)", async () => {
			const retrievedSong = await songService.get({
				slug: new Slug("My Artist", "My Song"),
			});

			expect(retrievedSong).toStrictEqual(dummyRepository.songA1);
		});

		it("should retrieve the song (by Id)", async () => {
			const retrievedSong = await songService.get({
				id: dummyRepository.songA2.id,
			});

			expect(retrievedSong).toStrictEqual(dummyRepository.songA2);
		});

		it("should retrieve the song (w/ include)", async () => {
			const retrievedSong = await songService.get(
				{ id: newSong.id },
				{ artist: true, genres: true, featuring: true },
			);

			expect(retrievedSong).toStrictEqual({
				...newSong,
				genres: [dummyRepository.genreA, dummyRepository.genreC],
				artist: dummyRepository.artistA,
				featuring: [],
			});
		});

		it("should throw, as the song does not exist (by Id)", async () => {
			const test = async () =>
				await songService.get({
					id: -1,
				});

			return expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw, as the song does not exist (by Slug)", async () => {
			const test = async () =>
				await songService.get({
					slug: new Slug("I dont exist"),
				});

			return expect(test()).rejects.toThrow(SongNotFoundException);
		});
	});

	describe("Get Multiple Songs", () => {
		it("should shuffle songs", async () => {
			const sort1 = await songService.getMany({}, 123, { take: 10 }, {});
			const sort2 = await songService.getMany({}, 1234, { take: 10 }, {});
			expect(sort1.length).toBe(sort2.length);
			expect(sort1).toContainEqual(dummyRepository.songB1);
			expect(sort1.map(({ id }) => id)).not.toBe(
				sort2.map(({ id }) => id),
			);
		});
		it("should get all the songs", async () => {
			const songs = await songService.getMany({});

			expect(songs.length).toBe(5);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songA2);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(dummyRepository.songC1);
			expect(songs).toContainEqual(newSong);
		});

		it("should get the songs from the artist (1 expected)", async () => {
			const songs = await songService.getMany({
				artist: { is: { id: dummyRepository.artistB.id } },
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(dummyRepository.songB1);
		});

		it("should get the songs from the artist (2 expected)", async () => {
			const songs = await songService.getMany({
				artist: { is: { id: dummyRepository.artistA.id } },
			});

			expect(songs.length).toBe(3);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songA2);
			expect(songs).toContainEqual(newSong);
		});

		it("should get the two songs, sorted by name (desc)", async () => {
			const songs = await songService.getMany(
				{
					artist: { is: { id: dummyRepository.artistA.id } },
				},
				{ sortBy: "name", order: "desc" },
				{},
				{},
			);

			expect(songs.length).toBe(3);
			expect(songs[0]).toStrictEqual(newSong);
			expect(songs[1]).toStrictEqual(dummyRepository.songA1);
			expect(songs[2]).toStrictEqual(dummyRepository.songA2);
		});

		it("should get none, as the artist does not exist", async () => {
			const songs = await songService.getMany({
				artist: { is: { id: -1 } },
			});

			expect(songs.length).toBe(0);
		});

		it("should get the song by name (starts with)", async () => {
			const songs = await songService.getMany({
				name: { startsWith: "My S" },
			});

			expect(songs.length).toBe(3);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(newSong);
		});

		it("should get the song by name (ends with)", async () => {
			const songs = await songService.getMany({
				name: { endsWith: " 3" },
			});

			expect(songs.length).toBe(1);
			expect(songs[0]).toStrictEqual(newSong);
		});
	});

	describe("Update Song", () => {
		it("should change the type of the song", async () => {
			let updatedSong = await songService.update(
				{ type: SongType.Clean },
				{
					slug: new Slug(dummyRepository.songA1.slug),
				},
			);

			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.type).toBe(SongType.Clean);
			updatedSong = await songService.update(
				{ type: dummyRepository.songA1.type },
				{ id: dummyRepository.songA1.id },
			);
			expect(updatedSong.id).toBe(dummyRepository.songA1.id);
			expect(updatedSong.type).toBe(dummyRepository.songA1.type);
		});

		it("should change the genres of the song", async () => {
			const updatedSong = await songService.update(
				{
					genres: [
						{ id: dummyRepository.genreA.id },
						{ id: dummyRepository.genreB.id },
					],
				},
				{ id: dummyRepository.songA2.id },
			);

			expect(updatedSong.id).toBe(dummyRepository.songA2.id);
			const refreshedSong = await songService.get(
				{ id: dummyRepository.songA2.id },
				{ genres: true },
			);
			expect(refreshedSong.genres).toContainEqual(dummyRepository.genreA);
			expect(refreshedSong.genres).toContainEqual(dummyRepository.genreB);
			expect(refreshedSong.genres.length).toBe(2);
		});

		it("should throw as the song does not exist", async () => {
			const test = async () =>
				await songService.update(
					{ type: SongType.Clean },
					{
						slug: new Slug("My Song"),
					},
				);
			return expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw as the genre does not exist", async () => {
			const test = async () =>
				await songService.update(
					{ genres: [{ id: -1 }] },
					{
						slug: new Slug("My Song"),
					},
				);
			return expect(test()).rejects.toThrow(GenreNotFoundException);
		});
	});

	describe("Get Song's Versions", () => {
		it("should return the song's versions", async () => {
			const version = await songService.create({
				name: "My Other Song (Remix)",
				artist: { id: dummyRepository.artistA.id },
				genres: [],
				group: {
					slug: new Slug(
						dummyRepository.artistA.name,
						"my-other-song",
					),
				},
			});
			const versions = await songService.getMany({
				versionsOf: { is: { id: dummyRepository.songA2.id } },
			});
			expect(versions).toStrictEqual([dummyRepository.songA2, version]);
			await songService.delete([{ id: version.id }]);
		});
	});

	describe("Increment a song's play count", () => {
		it("should increment the song's play count", async () => {
			const user = await dummyRepository.user.create({
				data: { admin: true, name: "A", password: "B" },
			});
			const queryParemeters = { id: dummyRepository.songA2.id };
			await songService.incrementPlayCount(user.id, queryParemeters);
			const playCount = await dummyRepository.playHistory.count({
				where: { userId: user.id, songId: queryParemeters.id },
			});

			expect(playCount).toBe(1);
		});
	});

	describe("Get or Create Song", () => {
		it("should get the song", async () => {
			const fetchedSong = await songService.getOrCreate({
				...dummyRepository.songA1,
				artist: { id: dummyRepository.artistA.id },
				genres: [],
				group: {
					slug: new Slug(
						dummyRepository.artistA.name,
						dummyRepository.songA1.slug,
					),
				},
			});
			expect(fetchedSong.id).toStrictEqual(dummyRepository.songA1.id);
			expect(fetchedSong.slug).toStrictEqual(dummyRepository.songA1.slug);
			expect(fetchedSong.name).toStrictEqual(dummyRepository.songA1.name);
		});

		it("should create the song", async () => {
			const createdSong = await songService.getOrCreate({
				name: "My Song 4",
				artist: { id: dummyRepository.artistB.id },
				genres: [],
				group: {
					slug: new Slug(dummyRepository.artistB.name, "my-song-4"),
				},
			});
			expect(createdSong.name).toBe("My Song 4");
			expect(createdSong.artistId).toBe(dummyRepository.artistB.id);
		});

		it("should throw as the parent artist does not exist ", async () => {
			const test = async () =>
				await songService.getOrCreate({
					name: "My Song 3",
					artist: { slug: new Slug("My Slug") },
					genres: [],
					group: {
						slug: new Slug(
							dummyRepository.artistB.name,
							"my-song-3",
						),
					},
				});
			return expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Set Master Track", () => {
		it("should set track as master", async () => {
			const updatedSong = await songService.update(
				{
					master: { id: dummyRepository.trackA1_2Video.id },
				},
				{ id: dummyRepository.songA1.id },
			);
			expect(updatedSong).toStrictEqual({
				...dummyRepository.songA1,
				masterId: dummyRepository.trackA1_2Video.id,
			});
		});
		it("should unset track as master", async () => {
			const updatedSong = await songService.update(
				{ master: null },
				{
					id: dummyRepository.songA1.id,
				},
			);
			expect(updatedSong).toStrictEqual({
				...dummyRepository.songA1,
			});
		});
	});

	describe("Delete Song", () => {
		it("should throw, as the song is not empty", async () => {
			const test = async () =>
				await songService.delete([{ id: dummyRepository.songA1.id }]);
			return expect(test()).rejects.toThrow(SongNotEmptyException);
		});
		it("should delete the song", async () => {
			const tmpSong = await songService.create({
				name: "1234",
				artist: { id: dummyRepository.artistA.id },
				genres: [],
				group: {
					slug: new Slug(dummyRepository.artistA.name, "1234"),
				},
			});
			await lyricsService.createOrUpdate({
				plain: "1234",
				songId: tmpSong.id,
			});
			await songService.delete([{ id: tmpSong.id }]);
			const test = async () => await songService.get({ id: tmpSong.id });
			await expect(test()).rejects.toThrow(SongNotFoundException);
			const testLyrics = async () =>
				await lyricsService.get({ songId: tmpSong.id });
			return expect(testLyrics()).rejects.toThrow(SongNotFoundException);
		});
	});

	describe("Natural sort", () => {
		it("should order by name, using natural sort", async () => {
			//Setup
			const tmpArtist = await dummyRepository.artist.create({
				data: {
					name: "TMP",
					slug: "tmp",
					sortName: "TMP",
					sortSlug: "tmp",
				},
			});
			const songGroup = { slug: new Slug("tmp") };
			const song1 = await songService.create({
				name: "A 02",
				artist: { id: tmpArtist.id },
				group: songGroup,
				genres: [],
			});
			const song2 = await songService.create({
				name: "B 01",
				artist: { id: tmpArtist.id },
				group: songGroup,
				genres: [],
			});

			const song3 = await songService.create({
				name: "B 2",
				artist: { id: tmpArtist.id },
				group: songGroup,
				genres: [],
			});

			const song4 = await songService.create({
				name: "B 23",
				artist: { id: tmpArtist.id },
				group: songGroup,
				genres: [],
			});

			const song5 = await songService.create({
				name: "B 003",
				artist: { id: tmpArtist.id },
				group: songGroup,
				genres: [],
			});
			const expectedOrder = [song1, song2, song3, song5, song4].map(
				({ id }) => ({ id }),
			);

			// assertions
			const sortedSongs = await songService.getMany(
				{ artist: { is: { id: tmpArtist.id } } },
				{ sortBy: "name" },
			);
			expect(sortedSongs.length).toBe(expectedOrder.length);
			for (const [idx, sortedSong] of sortedSongs.entries()) {
				expect(sortedSong.id).toBe(expectedOrder[idx].id);
			}

			//Teardown
			await dummyRepository.song.deleteMany({
				where: { artistId: tmpArtist.id },
			});
			await dummyRepository.artist.delete({
				where: { id: tmpArtist.id },
			});
		});
	});

	describe("Song with featuring", () => {
		let mainArtist: Artist;
		let featuredArtist: Artist;
		let baseSong: Song;
		let songWithFeaturing: Song;
		it("should create a song without featuring", async () => {
			mainArtist = await artistService.getOrCreate({
				name: "Katy Perry",
			});
			baseSong = await songService.create({
				name: "E.T.",
				artist: { id: mainArtist.id },
				group: {
					slug: new Slug(mainArtist.name, "e-t"),
				},
				genres: [],
			});
		});
		it("should create a song with featuring", async () => {
			featuredArtist = await artistService.getOrCreate({
				name: "Kanye West",
			});
			songWithFeaturing = await songService.getOrCreate({
				name: "E.T.",
				artist: { id: mainArtist.id },
				group: {
					slug: new Slug(mainArtist.name, "e-t"),
				},
				genres: [],
				featuring: [{ slug: new Slug(featuredArtist.slug) }],
			});
			expect(songWithFeaturing.id).not.toBe(baseSong.id);
			expect(songWithFeaturing.slug).toBe(
				"katy-perry-et-feat-kanye-west",
			);
			expect(songWithFeaturing.nameSlug).toBe("et");
		});

		it("should get the base song", async () => {
			const res = await songService.getOrCreate({
				name: "E.T.",
				artist: { id: mainArtist.id },
				group: {
					slug: new Slug(mainArtist.name, "e-t"),
				},
				genres: [],
			});
			expect(res).toStrictEqual(baseSong);
		});

		it("should get the featuring song", async () => {
			const res = await songService.getOrCreate({
				name: "E.T.",
				artist: { id: mainArtist.id },
				group: {
					slug: new Slug(mainArtist.name, "e-t"),
				},
				genres: [],
				featuring: [{ slug: new Slug(featuredArtist.slug) }],
			});
			expect(res).toStrictEqual(songWithFeaturing);
		});

		it("should get the featuring song, with featured artists", async () => {
			const res = await songService.get(
				{ id: songWithFeaturing.id },
				{ featuring: true },
			);
			expect(res.featuring).toStrictEqual([featuredArtist]);
		});
	});
});
