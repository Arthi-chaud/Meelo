import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import type { Genre } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import GenreModule from "./genre.module";

describe("Genre Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;

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
				SongModule,
				LyricsModule,
				ParserModule,
				ReleaseModule,
			],
			providers: [SongService, ArtistService, PrismaService],
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

	describe("Get Genres", () => {
		it("Should get all the genres", () => {
			return request(app.getHttpServer())
				.get("/genres")
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres).toContainEqual(dummyRepository.genreA);
					expect(genres).toContainEqual(dummyRepository.genreB);
					expect(genres).toContainEqual(dummyRepository.genreC);
				});
		});

		it("Should get some genres (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/genres?take=2&sortBy=name")
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres.length).toBe(2);
					expect(genres).toContainEqual(dummyRepository.genreA);
					expect(genres).toContainEqual(dummyRepository.genreB);
				});
		});

		it("Should get all genres, sorted", () => {
			return request(app.getHttpServer())
				.get("/genres?sortBy=name&order=desc")
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres[0]).toStrictEqual(dummyRepository.genreC);
					expect(genres[1]).toStrictEqual(dummyRepository.genreB);
					expect(genres[2]).toStrictEqual(dummyRepository.genreA);
				});
		});
	});

	describe("Get Genres of a song", () => {
		it("should return the song's genres", () => {
			return request(app.getHttpServer())
				.get(`/genres?song=${dummyRepository.songA2.slug}`)
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres).toStrictEqual([dummyRepository.genreB]);
				});
		});
	});

	describe("Get Genres of an album", () => {
		it("should return an array of genres", () => {
			return request(app.getHttpServer())
				.get(`/genres?album=${dummyRepository.albumA1.id}&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres).toStrictEqual([
						dummyRepository.genreA,
						dummyRepository.genreB,
					]);
				});
		});
	});
});
