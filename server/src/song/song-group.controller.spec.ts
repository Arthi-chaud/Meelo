import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Song } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import SongModule from "src/song/song.module";
import request from "supertest";
import {
	expectedArtistResponse,
	expectedSongGroupResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import type { SongGroupResponse } from "./models/song-group.response";

describe("Song Group Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

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
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
	});

	describe("Get Songs Groups (GET /song-groups)", () => {
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get("/song-groups?take=1&with=artist,featuring")
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongGroupResponse(dummyRepository.songA1, 1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						featuring: [],
					});
				});
		});
		it("should get all the artist's songs", () => {
			return request(app.getHttpServer())
				.get(`/song-groups?artist=${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					const songs: SongGroupResponse[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(
						expectedSongGroupResponse(dummyRepository.songA1, 1),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongGroupResponse(dummyRepository.songA2, 1),
					);
				});
		});
		it("should get all the artist's song-groups, sorted by name", () => {
			return request(app.getHttpServer())
				.get(
					`/song-groups?artist=${dummyRepository.artistA.id}&sortBy=name`,
				)
				.expect(200)
				.expect((res) => {
					const songs: SongGroupResponse[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(
						expectedSongGroupResponse(dummyRepository.songA2, 1),
					);
					expect(songs[1]).toStrictEqual(
						expectedSongGroupResponse(dummyRepository.songA1, 1),
					);
				});
		});
		it("should get some song-groups (w/ selector + pagination)", () => {
			return request(app.getHttpServer())
				.get(`/song-groups?artist=${dummyRepository.artistA.id}&skip=1`)
				.expect(200)
				.expect((res) => {
					const songs: SongGroupResponse[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(
						expectedSongGroupResponse(dummyRepository.songA2, 1),
					);
				});
		});
	});
});
