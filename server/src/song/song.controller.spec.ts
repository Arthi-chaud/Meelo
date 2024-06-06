import { createTestingModule } from "test/test-module";
import { TestingModule } from "@nestjs/testing";
import type { Lyrics, Song, Track } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import SongModule from "src/song/song.module";
import TestPrismaService from "test/test-prisma.service";
import SongService from "./song.service";
import SetupApp from "test/setup-app";
import {
	expectedSongResponse,
	expectedArtistResponse,
	expectedTrackResponse,
	expectedReleaseResponse,
} from "test/expected-responses";
import ProviderService from "src/providers/provider.service";
import SettingsService from "src/settings/settings.service";
import { IllustrationType, SongType } from "@prisma/client";
import Slug from "src/slug/slug";

jest.setTimeout(60000);

describe("Song Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let songService: SongService;
	let providerService: ProviderService;

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
		providerService = module.get(ProviderService);
		module.get(SettingsService).loadFromFile();
		await dummyRepository.onModuleInit();
		await providerService.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
	});

	describe("Get Songs (GET /songs)", () => {
		it("should return all songs", () => {
			return request(app.getHttpServer())
				.get(`/songs`)
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
		it("should return all songs, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get(`/songs?sortBy=name&order=desc`)
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
				.get(`/songs?skip=1&take=2`)
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
				.get(`/songs?with=artist&take=2`)
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
				.get(`/songs?take=1&with=artist,featuring`)
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
				.get(
					`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA2.slug}`,
				)
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
		it("should return song w/ external ID", async () => {
			const provider = await dummyRepository.provider.findFirstOrThrow();
			await dummyRepository.songExternalId.create({
				data: {
					songId: dummyRepository.songA1.id,
					providerId: provider.id,
					description: "Hey",
					value: "1234",
				},
			});
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}?with=externalIds`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						externalIds: [
							{
								provider: {
									name: provider.name,
									homepage: providerService
										.getProviderById(provider.id)
										.getProviderHomepage(),
									icon: `/illustrations/providers/${provider.name}/icon`,
								},
								description: "Hey",
								value: "1234",
								url: providerService
									.getProviderById(provider.id)
									.getSongURL("1234"),
							},
						],
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
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						featuring: [],
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA2),
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
				.get(
					`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA1.slug}/lyrics`,
				)
				.expect(200)
				.expect((res) => {
					const lyrics: Lyrics = res.body;
					expect(lyrics).toStrictEqual({
						lyrics: dummyRepository.lyricsA1.content,
					});
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
					lyrics: "123456",
				})
				.expect(async () => {
					const song = await songService.get(
						{ id: dummyRepository.songA2.id },
						{ lyrics: true },
					);
					expect(song.lyrics!.content).toBe("123456");
				});
		});

		it("should update the song's lyrics", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songA1.id}/lyrics`)
				.send({
					lyrics: "BLABLABLA",
				})
				.expect(async () => {
					const song = await songService.get(
						{ id: dummyRepository.songA1.id },
						{ lyrics: true },
					);
					expect(song.lyrics!.content).toBe("BLABLABLA");
				});
		});

		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.post(`/songs/${-1}/lyrics`)
				.send({
					lyrics: "BLABLABLA",
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
				.delete(
					`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA1.slug}/lyrics`,
				)
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
				.get(`/songs/${dummyRepository.songC1.id}`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...song,
						illustration: {
							...illustration,
							url: "/illustrations/" + illustration.id,
						},
					});
				});
		});
	});

	describe("Update Song", () => {
		it("Should update Song's Type", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songB1.id}`)
				.send({
					type: SongType.Remix,
				})
				.expect(201)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songB1),
						type: SongType.Remix,
					});
				});
		});
	});
});
