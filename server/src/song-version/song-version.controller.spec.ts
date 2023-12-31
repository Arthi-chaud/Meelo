import { createTestingModule } from "test/test-module";
import { TestingModule } from "@nestjs/testing";
import type { Lyrics, Song, Track } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import SongModule from "src/song/song.module";
import TestPrismaService from "test/test-prisma.service";
import SetupApp from "test/setup-app";
import {
	expectedSongResponse,
	expectedArtistResponse,
	expectedTrackResponse,
	expectedReleaseResponse,
} from "test/expected-responses";
import ProviderService from "src/providers/provider.service";
import SettingsService from "src/settings/settings.service";
import { SongType } from "@prisma/client";
import SongVersionModule from "./song-version.module";

jest.setTimeout(60000);

describe("Song Version Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let providerService: ProviderService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [SongModule, SongVersionModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		providerService = module.get(ProviderService);
		module.get(SettingsService).loadFromFile();
		await dummyRepository.onModuleInit();
		await providerService.onModuleInit();
	});

	afterAll(() => {
		app.close();
	});
	describe("Get Song's Versions (GET /songs/:id/versions)", () => {
		it("should return the song's versions", async () => {
			return request(app.getHttpServer())
				.get(
					`/songs/${dummyRepository.songA2.id}/versions?sortBy=id&order=desc`,
				)
				.expect(200)
				.expect((res) => {
					const fetchedSongs: Song[] = res.body.items;
					expect(fetchedSongs).toStrictEqual([
						
					]);
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/versions`)
				.expect(404);
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
