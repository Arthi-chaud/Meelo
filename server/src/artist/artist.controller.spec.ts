import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import { IllustrationType } from "src/prisma/generated/client";
import type { Artist } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import request from "supertest";
import { expectedArtistResponse } from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import ArtistModule from "./artist.module";
import ArtistService from "./artist.service";

describe("Artist Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				ReleaseModule,
				PrismaModule,
				ArtistModule,
				SongModule,
				AlbumModule,
				TrackModule,
				ParserModule,
				IllustrationModule,
				GenreModule,
				LyricsModule,
				FileModule,
				SettingsModule,
			],
			providers: [
				ArtistService,
				SongService,
				AlbumService,
				ReleaseService,
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

	describe("Get Artists (GET /artists)", () => {
		it("should get all the artists", () => {
			return request(app.getHttpServer())
				.get("/artists")
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistC),
					);
				});
		});

		it("should get all the artists, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get("/artists?sortBy=name&order=desc")
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistC),
					);
					expect(artists[1]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
					expect(artists[2]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
				});
		});
		it("should get only the album artists", () => {
			return request(app.getHttpServer())
				.get("/artists?primaryArtistsOnly=true")
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
				});
		});
		it("should get some artists (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/artists?skip=1&take=1")
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
				});
		});
	});

	describe("Get Artist (GET /artists/:id)", () => {
		it("should get the artist (by id)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					const artist: Artist = res.body;
					expect(artist).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
				});
		});

		it("should get the artist (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistB.slug}`)
				.expect(200)
				.expect((res) => {
					const artist: Artist = res.body;
					expect(artist).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
				});
		});

		it("should return an error, as the artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${-1}`)
				.expect(404);
		});

		it("should return an error, as the compilation artist 'does not exist'", () => {
			return request(app.getHttpServer())
				.get(`/artists/${compilationAlbumArtistKeyword}`)
				.expect(400);
		});
	});

	describe("Get all album Artists from library", () => {
		it("should return every artists (1 expected)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?primaryArtistsOnly=true&library=${dummyRepository.library1.id}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
				});
		});

		it("should return every artists (1 expected)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?library=and:${dummyRepository.library1.id},${dummyRepository.library2.id}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
				});
		});

		it("should return every artists (1 expected)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?primaryArtistsOnly=true&library=${dummyRepository.library2.id}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
					expect(artists[1]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
				});
		});

		it("should return every artists (from library's slug)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?primaryArtistsOnly=true&library=${dummyRepository.library1.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
				});
		});
	});

	describe("Get Artists by genre", () => {
		it("Should get all the artists", () => {
			return request(app.getHttpServer())
				.get(`/artists?genre=${dummyRepository.genreB.id}`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
				});
		});

		it("Should get all the artists (one expected)", () => {
			return request(app.getHttpServer())
				.get(`/artists?genre=${dummyRepository.genreC.id}`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistC),
					);
				});
		});

		it("Should get some artists (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?genre=${dummyRepository.genreB.id}&skip=1&sortBy=name`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
				});
		});

		it("Should get all artists, sorted", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?genre=${dummyRepository.genreB.id}&sortBy=name&order=desc`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB),
					);
					expect(artists[1]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA),
					);
				});
		});
	});

	describe("Get Artists by Album", () => {
		it("Should get all the artist in the compilation", () => {
			return request(app.getHttpServer())
				.get(`/artists?album=${dummyRepository.compilationAlbumA.id}`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual(
						expectedArtistResponse(dummyRepository.artistC),
					);
				});
		});
	});

	describe("Get artists by label", () => {
		it("should return artists by label", () => {
			return request(app.getHttpServer())
				.get(`/artists?sortBy=id&label=${dummyRepository.labelA.id}`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists[0].id).toBe(dummyRepository.artistA.id);
					expect(artists[1].id).toBe(dummyRepository.artistB.id);
				});
		});

		it("should return artists by label (using not:)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?sortBy=id&label=not:${dummyRepository.labelA.id}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(0);
				});
		});

		it("should return artists by label (using and:)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?sortBy=id&label=and:${dummyRepository.labelA.id},${dummyRepository.labelB.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0].id).toBe(dummyRepository.artistA.id);
				});
		});

		it("should return artists by label (using or:)", () => {
			return request(app.getHttpServer())
				.get(
					`/artists?sortBy=id&label=or:${dummyRepository.labelA.id},${dummyRepository.labelB.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists[0].id).toBe(dummyRepository.artistA.id);
					expect(artists[1].id).toBe(dummyRepository.artistB.id);
				});
		});
	});

	describe("Artist Illustration", () => {
		it("Should return the illustration", async () => {
			const illustration = await dummyRepository.illustration.create({
				data: {
					artist: { connect: { id: dummyRepository.artistB.id } },
					type: IllustrationType.Avatar,
					blurhash: "A",
					aspectRatio: 2,
					colors: ["B"],
				},
			});
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistB.id}?with=illustration`)
				.expect(200)
				.expect((res) => {
					const artist: Artist = res.body;
					expect(artist).toStrictEqual({
						...artist,
						illustration: {
							...illustration,
							url: `/illustrations/${illustration.id}`,
						},
					});
				});
		});
	});
});
