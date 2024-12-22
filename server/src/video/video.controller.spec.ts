import { createTestingModule } from "test/test-module";
import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import SongModule from "src/song/song.module";
import TestPrismaService from "test/test-prisma.service";
import SetupApp from "test/setup-app";
import { VideoResponse } from "./models/video.response";
import {
	expectedSongResponse,
	expectedTrackResponse,
} from "test/expected-responses";
import VideoModule from "./video.module";

jest.setTimeout(60000);

describe("Video Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [SongModule, VideoModule],
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
	});

	describe("Get Videos", () => {
		it("should return videos", () => {
			return request(app.getHttpServer())
				.get(`/videos`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						track: {
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
							illustration: null,
						},
					});
				});
		});
		it("should return an empty list (pagination)", () => {
			return request(app.getHttpServer())
				.get(`/videos?skip=1`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(0);
				});
		});
		it("should return songs with their lyrics", () => {
			return request(app.getHttpServer())
				.get(`/videos?with=lyrics`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedSongResponse({
							...dummyRepository.songA1,
							lyrics: dummyRepository.lyricsA1,
						}),
						track: {
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
							illustration: null,
						},
					});
				});
		});
	});

	describe("Get Artist's Videos", () => {
		it("should get all the artist's videos", () => {
			return request(app.getHttpServer())
				.get(`/videos?artist=${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					const songs: VideoResponse[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						track: {
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
							illustration: null,
						},
					});
				});
		});
		it("should get 0 videos", () => {
			return request(app.getHttpServer())
				.get(`/videos?artist=${dummyRepository.artistC.id}`)
				.expect(200)
				.expect((res) => {
					const songs: VideoResponse[] = res.body.items;
					expect(songs.length).toBe(0);
				});
		});
	});

	describe("Get Videos from library", () => {
		it("should return the songs With video", async () => {
			return request(app.getHttpServer())
				.get(`/videos?library=${dummyRepository.library1.id}`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						track: {
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
							illustration: null,
						},
					});
				});
		});
		it("should return the songs With video (empty page)", async () => {
			return request(app.getHttpServer())
				.get(`/videos?library=${dummyRepository.library1.id}&skip=1`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(0);
				});
		});
		it("should return an empty list (no videos in library)", async () => {
			return request(app.getHttpServer())
				.get(`/videos?library=${dummyRepository.library2.id}`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(0);
				});
		});
	});
});
