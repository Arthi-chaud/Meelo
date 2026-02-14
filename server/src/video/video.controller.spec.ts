import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Video } from "src/prisma/generated/client";
import PrismaService from "src/prisma/prisma.service";
import SongModule from "src/song/song.module";
import request from "supertest";
import {
	expectedArtistResponse,
	expectedTrackResponse,
	expectedVideoResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import type { VideoResponse } from "./models/video.response";
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
				.get("/videos?with=master,illustration")
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedVideoResponse(dummyRepository.videoA1),
						illustration: null,
						master: {
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
						},
					});
				});
		});
		it("should return an empty list (pagination)", () => {
			return request(app.getHttpServer())
				.get("/videos?skip=1")
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(0);
				});
		});
		it("should return video with their artist", () => {
			return request(app.getHttpServer())
				.get("/videos?with=artist")
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedVideoResponse({
							...dummyRepository.videoA1,
						}),
						artist: expectedArtistResponse(dummyRepository.artistA),
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
						...expectedVideoResponse(dummyRepository.videoA1),
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
		it("should return the videos", async () => {
			return request(app.getHttpServer())
				.get(`/videos?library=${dummyRepository.library1.id}`)
				.expect(200)
				.expect((res) => {
					const videoSongs: VideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedVideoResponse(dummyRepository.videoA1),
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

	describe("Update Video", () => {
		it("should set track as master", () => {
			return request(app.getHttpServer())
				.put(`/videos/${dummyRepository.videoA1.id}`)
				.send({
					masterTrackId: dummyRepository.trackA1_2Video.id,
				})
				.expect((res) => {
					const video: Video = res.body;
					expect(video.masterId).toBe(
						dummyRepository.trackA1_2Video.id,
					);
				});
		});

		it("should fail as track does not belong to video", () => {
			return request(app.getHttpServer())
				.put(`/videos/${dummyRepository.videoA1.id}`)
				.send({
					masterTrackId: dummyRepository.trackA1_1.id,
				})
				.expect(400);
		});
	});
});
