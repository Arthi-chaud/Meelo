import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { IllustrationType, SongType } from "src/prisma/generated/client";
import { LyricsResponse, SyncedLyric } from "src/lyrics/models/lyrics.response";
import type { Song } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import SongModule from "src/song/song.module";
import request from "supertest";
import {
	expectedArtistResponse,
	expectedSongResponse,
	expectedTrackResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import SongService from "./song.service";

jest.setTimeout(60000);

describe("Song Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let songService: SongService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [SongModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		songService = module.get(SongService);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
	});

	describe("Get Songs (GET /songs)", () => {
		it("should return all songs", () => {
			return request(app.getHttpServer())
				.get("/songs")
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(4);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
					expect(songs[2]).toStrictEqual(
						expectedSongResponse(dummyRepository.songB1),
					);
					expect(songs[3]).toStrictEqual(
						expectedSongResponse(dummyRepository.songC1),
					);
				});
		});

		it("should songs from artist A or B", () => {
			return request(app.getHttpServer())
				.get(
					`/songs?artist=or:${dummyRepository.artistC.id},${dummyRepository.artistB.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songB1),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongResponse(dummyRepository.songC1),
					);
				});
		});
		it("should return all songs, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get("/songs?sortBy=name&order=desc")
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(4);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongResponse(dummyRepository.songB1),
					);
					expect(songs[2]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
					expect(songs[3]).toStrictEqual(
						expectedSongResponse(dummyRepository.songC1),
					);
				});
		});
		it("should return some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/songs?skip=1&take=2")
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(
						expectedSongResponse(dummyRepository.songB1),
					);
					expect(songs).toContainEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
				});
		});
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get("/songs?with=artist&take=2")
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
					expect(songs[1]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
				});
		});
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get("/songs?take=1&with=artist,featuring")
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						featuring: [],
					});
				});
		});
	});

	describe("Get Song (GET /songs/:id)", () => {
		it("should return song", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
				});
		});
		it("should return song (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA2.slug}`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
				});
		});
		it("should return song w/ artist and master track", () => {
			return request(app.getHttpServer())
				.get(
					`/songs/${dummyRepository.songA1.id}?with=artist,featuring,master`,
				)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						master: expectedTrackResponse(
							dummyRepository.trackA1_1,
						),
						featuring: [],
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer()).get(`/songs/${-1}`).expect(404);
		});
	});

	describe("Get Artist's Songs", () => {
		it("should get all the artist's songs", () => {
			return request(app.getHttpServer())
				.get(`/songs?artist=${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
				});
		});
		it("should get all the artist's songs, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/songs?artist=${dummyRepository.artistA.id}&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
				});
		});
		it("should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs?artist=${dummyRepository.artistA.id}&skip=1`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
				});
		});
		it("should get all songs, w/ artist", () => {
			return request(app.getHttpServer())
				.get(
					`/songs?artist=${dummyRepository.artistA.id}&with=artist,featuring`,
				)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						featuring: [],
					});
					expect(songs[1]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA),
						featuring: [],
					});
				});
		});
	});

	describe("Get Genre's songs", () => {
		it("Should get all the songs", () => {
			return request(app.getHttpServer())
				.get(`/songs?genre=${dummyRepository.genreB.id}`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
					expect(songs).toContainEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
					expect(songs).toContainEqual(
						expectedSongResponse(dummyRepository.songB1),
					);
				});
		});

		it("Should get all the songs (one expected)", () => {
			return request(app.getHttpServer())
				.get(`/songs?genre=${dummyRepository.genreC.id}`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs).toContainEqual(
						expectedSongResponse(dummyRepository.songC1),
					);
				});
		});

		it("Should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs?genre=${dummyRepository.genreB.id}&skip=1&take=1`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
				});
		});

		it("Should get all songs, sorted", () => {
			return request(app.getHttpServer())
				.get(
					`/songs?genre=${dummyRepository.genreB.id}&sortBy=name&order=desc`,
				)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs[1]).toStrictEqual(
						expectedSongResponse(dummyRepository.songB1),
					);
					expect(songs[2]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA2),
					);
					expect(songs[0]).toStrictEqual(
						expectedSongResponse(dummyRepository.songA1),
					);
				});
		});

		it("Should get songs, w/ artist", () => {
			return request(app.getHttpServer())
				.get(
					`/songs?genre=${dummyRepository.genreB.id}&sortBy=name&take=1&with=artist`,
				)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
				});
		});
	});

	describe("Get Songs from library", () => {
		it("should return every songs, w/ parent artist", () => {
			return request(app.getHttpServer())
				.get(
					`/songs?library=${dummyRepository.library1.id}&with=artist,featuring`,
				)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						featuring: [],
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songC1),
						artist: expectedArtistResponse(dummyRepository.artistC),
						featuring: [],
					});
				});
		});
	});

	describe("Get Song's Lyrics (GET /songs/:id/lyrics)", () => {
		it("should return the song's lyrics", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.slug}/lyrics`)
				.expect(200)
				.expect((res) => {
					const lyrics: LyricsResponse = res.body;
					expect(lyrics.plain).toStrictEqual(
						dummyRepository.lyricsA1.plain,
					);
				});
		});

		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/lyrics`)
				.expect(404);
		});

		it("should return an error, as the lyrics do not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songC1.id}/lyrics`)
				.expect(404);
		});
	});

	describe("Update Song's Lyrics (POST /songs/:id/lyrics)", () => {
		it("should create the song's lyrics", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songA2.id}/lyrics`)
				.send({
					plain: "123456",
					synced: [
						{ content: "123456", timestamp: 0 },
					] satisfies SyncedLyric[],
				})
				.expect(async () => {
					const song = await songService.get(
						{ id: dummyRepository.songA2.id },
						{ lyrics: true },
					);
					expect(song.lyrics!.plain).toBe("123456");
					expect(song.lyrics?.synced).toStrictEqual([
						{
							content: "123456",
							timestamp: 0,
						},
					]);
				});
		});

		it("should update the song's lyrics", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songA1.id}/lyrics`)
				.send({
					plain: "BLABLABLA",
					synced: [
						{ content: "BLABLABLA", timestamp: 1 },
					] satisfies SyncedLyric[],
				})
				.expect(async () => {
					const song = await songService.get(
						{ id: dummyRepository.songA1.id },
						{ lyrics: true },
					);
					expect(song.lyrics!.plain).toBe("BLABLABLA");
					expect(song.lyrics!.synced).toStrictEqual([
						{
							content: "BLABLABLA",
							timestamp: 1,
						},
					]);
				});
		});
		it("should return an error, as the synced lyrics are badly typed", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.lyricsA1.id}/lyrics`)
				.send({
					plain: "BLABLABLA",
					synced: [{ a: "1" }],
				})
				.expect(400);
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.post(`/songs/${-1}/lyrics`)
				.send({
					plain: "BLABLABLA",
				})
				.expect(404);
		});
		it("should return an error, as the body is empty", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songB1.id}/lyrics`)
				.expect(400);
		});
	});

	describe("Delete Song's Lyrics (DELETE /songs/:id/lyrics)", () => {
		it("should return the song's lyrics", () => {
			return request(app.getHttpServer())
				.delete(`/songs/${dummyRepository.songA1.slug}/lyrics`)
				.expect(200)
				.expect(async () => {
					const song = await songService.get(
						{ id: dummyRepository.songA1.id },
						{ lyrics: true },
					);
					expect(song.lyrics).toBeNull();
				});
		});

		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.delete(`/songs/${-1}/lyrics`)
				.expect(404);
		});

		it("should return an error, as the lyrics do not exist", () => {
			return request(app.getHttpServer())
				.delete(`/songs/${dummyRepository.songC1.id}/lyrics`)
				.expect(404);
		});
	});

	describe("Get Song's Versions (GET /songs/:id/versions)", () => {
		it("should return the song's versions", async () => {
			const version = await songService.create({
				name: "My Other Song (Remix)",
				artist: { id: dummyRepository.artistA.id },
				group: {
					slug: new Slug(
						dummyRepository.artistA.name,
						"my-other-song",
					),
				},
				genres: [],
			});
			return request(app.getHttpServer())
				.get(
					`/songs?versionsOf=${dummyRepository.songA2.id}&sortBy=id&order=desc`,
				)
				.expect(200)
				.expect((res) => {
					const fetchedSongs: Song[] = res.body.items;
					expect(fetchedSongs).toStrictEqual([
						{
							...expectedSongResponse(version),
							type: SongType.Remix,
						},
						expectedSongResponse(dummyRepository.songA2),
					]);
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/versions`)
				.expect(404);
		});
	});

	describe("Song Illustration", () => {
		it("Should return the Song illustration", async () => {
			const { illustration } =
				await dummyRepository.releaseIllustration.create({
					data: {
						release: {
							connect: {
								id: dummyRepository.compilationReleaseA1.id,
							},
						},
						hash: "a",
						illustration: {
							create: {
								aspectRatio: 1,
								blurhash: "A",
								colors: ["B"],
								type: IllustrationType.Cover,
							},
						},
					},
					include: { illustration: true },
				});
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songC1.id}?with=illustration`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...song,
						illustration: {
							...illustration,
							url: `/illustrations/${illustration.id}`,
						},
					});
				});
		});
	});

	describe("Update Song", () => {
		it("Should update Song's Type", () => {
			return request(app.getHttpServer())
				.put(`/songs/${dummyRepository.songB1.id}`)
				.send({
					type: SongType.Remix,
				})
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songB1),
						type: SongType.Remix,
					});
				});
		});

		it("Should update Song's Type", () => {
			return request(app.getHttpServer())
				.put(`/songs/${dummyRepository.songB1.id}`)
				.send({
					genres: ["a", "B", "c"],
				})
				.expect(200)
				.expect(async () => {
					const songGenres = await dummyRepository.genre
						.findMany({
							where: {
								songs: {
									some: { id: dummyRepository.songB1.id },
								},
							},
						})
						.then((genres) => genres.map(({ name }) => name));
					expect(songGenres).toContain("a");
					expect(songGenres).toContain("B");
					expect(songGenres).toContain("c");
					// Check previously linked genre still exists
					expect(songGenres).toContain("My Genre B");
				});
		});

		it("should set track as master", () => {
			return request(app.getHttpServer())
				.put(`/songs/${dummyRepository.songA1.id}`)
				.send({
					masterTrackId: dummyRepository.trackA1_2Video.id,
				})
				.expect((res) => {
					const song: Song = res.body;
					expect(song.masterId).toBe(
						dummyRepository.trackA1_2Video.id,
					);
				});
		});

		it("should fail as track does not belong to song", () => {
			return request(app.getHttpServer())
				.put(`/songs/${dummyRepository.songA1.id}`)
				.send({
					masterTrackId: dummyRepository.trackC1_1.id,
				})
				.expect(400);
		});
		describe("Merging songs", () => {
			it("Should merge songs", async () => {
				await request(app.getHttpServer())
					.post(`/songs/${dummyRepository.songB1.id}/merge`)
					.send({
						songId: dummyRepository.songC1.id,
					})
					.expect(201);
				await request(app.getHttpServer())
					.get(`/songs/${dummyRepository.songB1.id}`)
					.expect(404);
			});
		});
	});
});
