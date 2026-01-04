import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import LibraryModule from "src/library/library.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import { IllustrationType } from "src/prisma/generated/client";
import type { Track } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import request from "supertest";
import {
	expectedReleaseResponse,
	expectedSongResponse,
	expectedTrackResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";

describe("Track Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				AlbumModule,
				ArtistModule,
				ReleaseModule,
				TrackModule,
				IllustrationModule,
				SongModule,
				ParserModule,
				GenreModule,
				LyricsModule,
				LibraryModule,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Get Tracks (GET /tracks)", () => {
		it("should return all the tracks", () => {
			return request(app.getHttpServer())
				.get("/tracks")
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(5);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackA1_1),
					);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackA2_1),
					);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackB1_1),
					);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackC1_1),
					);
				});
		});
		it("should return all the tracks, sorted by name", () => {
			return request(app.getHttpServer())
				.get("/tracks?sortBy=name")
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(5);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackC1_1),
					);
					expect(tracks[1]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA2_1),
					);
					expect(tracks[2]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackB1_1),
					);
					expect(tracks[3]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_1),
					);
					expect(tracks[4]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
				});
		});
		it("should return some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/tracks?skip=1&take=2&sortBy=name")
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA2_1),
					);
					expect(tracks[1]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackB1_1),
					);
				});
		});
		it("should return tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get("/tracks?take=1&skip=1&with=song&sortBy=name")
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						song: expectedSongResponse(dummyRepository.songA2),
					});
				});
		});
	});

	describe("Get Song Master (GET /tracks/master/song/:id)", () => {
		it("should return master track", () => {
			return request(app.getHttpServer())
				.get(`/tracks/master/song/${dummyRepository.songB1.id}`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackB1_1),
					);
				});
		});
		it("should return master track w/ song & release", () => {
			return request(app.getHttpServer())
				.get(
					`/tracks/master/song/${dummyRepository.songA1.id}?with=song,release`,
				)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						song: expectedSongResponse(dummyRepository.songA1),
						release: expectedReleaseResponse(
							dummyRepository.releaseA1_1,
						),
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/tracks/master/song/${-1}`)
				.expect(404);
		});
	});

	describe("Get Tracks by Library", () => {
		it("should return every tracks, w/ song & parent release", () => {
			return request(app.getHttpServer())
				.get(
					`/tracks?library=${dummyRepository.library1.id}&with=song,release`,
				)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(3);
					expect(tracks).toContainEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						release: expectedReleaseResponse(
							dummyRepository.releaseA1_1,
						),
						song: expectedSongResponse(dummyRepository.songA1),
					});
					expect(tracks).toContainEqual({
						...expectedTrackResponse(
							dummyRepository.trackA1_2Video,
						),
						release: expectedReleaseResponse(
							dummyRepository.releaseA1_2,
						),
						song: expectedSongResponse(dummyRepository.songA1),
					});
					expect(tracks).toContainEqual({
						...expectedTrackResponse(dummyRepository.trackC1_1),
						release: expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
						song: expectedSongResponse(dummyRepository.songC1),
					});
				});
		});
	});

	describe("Get Tracks by song", () => {
		it("should return tracks", () => {
			return request(app.getHttpServer())
				.get(`/tracks?song=${dummyRepository.songA1.id}`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_1),
					);
					expect(tracks[1]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
				});
		});
		it("should return some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?song=${dummyRepository.songA1.id}&take=1`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_1),
					);
				});
		});
		it("should return tracks w/ song", () => {
			return request(app.getHttpServer())
				.get(`/tracks?song=${dummyRepository.songB1.id}&with=song`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackB1_1),
						song: expectedSongResponse(dummyRepository.songB1),
					});
				});
		});
	});

	describe("Get Tracks by Release", () => {
		it("should get all the tracks (2 expected)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?release=${dummyRepository.releaseA1_2.id}`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackA2_1),
					);
				});
		});
		it("should get all the tracks (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?release=${dummyRepository.releaseA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks).toContainEqual(
						expectedTrackResponse(dummyRepository.trackA1_1),
					);
				});
		});
		it("should get all the tracks, sorted by name", () => {
			return request(app.getHttpServer())
				.get(
					`/tracks?release=${dummyRepository.releaseA1_2.id}&sortBy=name`,
				)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA2_1),
					);
					expect(tracks[1]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
				});
		});
		it("should get some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(
					`/tracks?release=${dummyRepository.releaseA1_2.id}&skip=1&sortBy=name`,
				)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
				});
		});
		it("should get tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get(
					`/tracks?release=${dummyRepository.releaseA1_1.id}&with=song`,
				)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						song: expectedSongResponse(dummyRepository.songA1),
					});
				});
		});
	});

	describe("Get Videos Tracks", () => {
		it("should return all the tracks", () => {
			return request(app.getHttpServer())
				.get("/tracks?type=Video")
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
				});
		});

		it("should return some the tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/tracks?type=Video&skip=1")
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(0);
				});
		});
	});

	describe("Get Track (GET /tracks/:id)", () => {
		it("should return the track", () => {
			return request(app.getHttpServer())
				.get(`/tracks/${dummyRepository.trackA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_1),
					);
				});
		});
		it("should return track w/ related release & song", () => {
			return request(app.getHttpServer())
				.get(
					`/tracks/${dummyRepository.trackA2_1.id}?with=song,release`,
				)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						song: expectedSongResponse(dummyRepository.songA2),
						release: expectedReleaseResponse(
							dummyRepository.releaseA1_2,
						),
					});
				});
		});
		it("should return an error, as the track does not exist", () => {
			return request(app.getHttpServer()).get("/tracks/-1").expect(404);
		});
	});

	describe("Get Song Video Tracks", () => {
		it("should return all video tracks (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?song=${dummyRepository.songA1.id}&type=Video`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					);
				});
		});

		it("should return all video tracks (0 expected)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?song=${dummyRepository.songB1.id}&type=Video`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(0);
				});
		});
	});

	describe("Track Illustration", () => {
		it("Should return the track illustration", async () => {
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
				.get(
					`/tracks/${dummyRepository.trackC1_1.id}?with=illustration`,
				)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual({
						...track,
						illustration: {
							...illustration,
							url: `/illustrations/${illustration.id}`,
						},
					});
				});
		});
	});

	describe("Update track", () => {
		it("Should reassign track", async () => {
			await request(app.getHttpServer())
				.put(`/tracks/${dummyRepository.trackC1_1.id}`)
				.send({ songId: dummyRepository.songB1.id })
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track.songId).toStrictEqual(
						dummyRepository.songB1.id,
					);
				});
			// Should fail at reasigning it back, as the old empty parent should have been deleted
			await request(app.getHttpServer())
				.put(`/tracks/${dummyRepository.trackC1_1.id}`)
				.send({ songId: dummyRepository.songC1.id })
				.expect(404);
		});
	});
});
