import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import LabelModule from "src/label/label.module";
import ParserModule from "src/parser/parser.module";
import { type Genre, IllustrationType } from "src/prisma/generated/client";
import type { Album, Artist } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import request from "supertest";
import {
	expectedAlbumResponse,
	expectedArtistResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import AlbumModule from "./album.module";

jest.setTimeout(60000);

describe("Album Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				ArtistModule,
				AlbumModule,
				PrismaModule,
				ReleaseModule,
				ParserModule,
				SongModule,
				TrackModule,
				IllustrationModule,
				GenreModule,
				FileModule,
				LabelModule,
			],
			providers: [ArtistService, ReleaseService],
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

	describe("Get Albums (GET /albums)", () => {
		it("Should return all albums", () => {
			return request(app.getHttpServer())
				.get("/albums")
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(3);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
					expect(albums[1]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
					expect(albums[2]).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
				});
		});

		it("Should all albums from A and B", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?artist=or:${dummyRepository.artistA.id},${dummyRepository.artistB.id}`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
					expect(albums[1]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
				});
		});
		it("Should return best-of albums only", () => {
			return request(app.getHttpServer())
				.get("/albums?type=Compilation")
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
				});
		});
		it("Should sort all albums", () => {
			return request(app.getHttpServer())
				.get("/albums?sortBy=name&order=desc")
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(3);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
					expect(albums[1]).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
					expect(albums[2]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
				});
		});
		it("Should return some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/albums?skip=1&take=1")
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
				});
		});
		it("Should return some albums (w/ cursor)", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?take=1&afterId=${dummyRepository.albumA1.id}&sortBy=id&order=asc`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
				});
		});
		it("Should return some albums (w/ pagination and cursor)", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?skip=1&afterId=${dummyRepository.albumA1.id}&sortBy=id&order=asc`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
				});
		});
		it("Should include related artist", () => {
			return request(app.getHttpServer())
				.get("/albums?with=artist&take=1")
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
				});
		});
	});

	describe("Get Compilations Albums", () => {
		it("Should return all albums", () => {
			return request(app.getHttpServer())
				.get("/albums?artist=compilations")
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
				});
		});
	});

	describe("Get Genre's albums", () => {
		it("Should get all the albums (2 expected)", () => {
			return request(app.getHttpServer())
				.get(`/albums?genre=${dummyRepository.genreB.id}`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums).toContainEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
					expect(albums).toContainEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
				});
		});

		it("Should get all the albums (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/albums?genre=${dummyRepository.genreA.id}`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
				});
		});

		it("Should get some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?genre=${dummyRepository.genreB.id}&sortBy=name&take=1`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
				});
		});

		it("Should get all albums, sorted", () => {
			return request(app.getHttpServer())
				.get(`/albums?genre=${dummyRepository.genreB.id}&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
					expect(albums[1]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
				});
		});

		it("Should get all albums, w/ artist", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?genre=${dummyRepository.genreB.id}&sortBy=name&take=1&with=artist`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
				});
		});
	});

	describe("Get Album (GET /albums/:id)", () => {
		it("Should return album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumB1.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumB1),
					);
				});
		});

		it("Should return album (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.slug}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
				});
		});
		it("Should return compilation album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.compilationAlbumA.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer()).get("/albums/-1").expect(404);
		});
		it("Should include related artist", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumB1.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumB1),
						artist: expectedArtistResponse(dummyRepository.artistB),
					});
				});
		});
		it("Should include related artist (null)", () => {
			return request(app.getHttpServer())
				.get(
					`/albums/${dummyRepository.compilationAlbumA.id}?with=artist`,
				)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
						artist: null,
					});
				});
		});
		it("Should return an error, the album does not exists", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.artistA.slug}`)
				.expect(404);
		});
	});

	describe("Get albums by label", () => {
		it("should return albums by label", () => {
			return request(app.getHttpServer())
				.get(`/albums?sortBy=id&label=${dummyRepository.labelA.id}`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0].id).toBe(dummyRepository.albumA1.id);
					expect(albums[1].id).toBe(dummyRepository.albumB1.id);
				});
		});

		it("should return albums by label (using not:)", () => {
			return request(app.getHttpServer())
				.get(`/albums?sortBy=id&label=not:${dummyRepository.labelA.id}`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0].id).toBe(
						dummyRepository.compilationAlbumA.id,
					);
				});
		});

		it("should return albums by label (using and: )", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?sortBy=id&label=and:${dummyRepository.labelA.id},${dummyRepository.labelB.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0].id).toBe(dummyRepository.albumA1.id);
				});
		});

		it("should return albums by label (using or: )", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?sortBy=id&label=or:${dummyRepository.labelA.id},${dummyRepository.labelB.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0].id).toBe(dummyRepository.albumA1.id);
					expect(albums[1].id).toBe(dummyRepository.albumB1.id);
				});
		});
	});

	describe("Get Albums by Library", () => {
		it("should return every albums w/ artist", () => {
			return request(app.getHttpServer())
				.get(
					`/albums?library=${dummyRepository.library1.id}&with=artist`,
				)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
					expect(albums[1]).toStrictEqual({
						...expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
						artist: null,
					});
				});
		});

		describe("Get Albums by Appearance", () => {
			it("should return compilation album", () => {
				return request(app.getHttpServer())
					.get(`/albums?appearance=${dummyRepository.artistC.id}`)
					.expect(200)
					.expect((res) => {
						const albums: Album[] = res.body.items;
						expect(albums.length).toBe(1);
						expect(albums[0]).toStrictEqual(
							expectedAlbumResponse(
								dummyRepository.compilationAlbumA,
							),
						);
					});
			});
			it("should return nothing", () => {
				return request(app.getHttpServer())
					.get(`/albums?appearance=${dummyRepository.artistB.id}`)
					.expect(200)
					.expect((res) => {
						const albums: Album[] = res.body.items;
						expect(albums.length).toBe(0);
					});
			});
		});

		it("should return every albums (from library's slug))", () => {
			return request(app.getHttpServer())
				.get(`/albums?library=${dummyRepository.library1.slug}`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
					expect(albums[1]).toStrictEqual(
						expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					);
				});
		});
	});

	describe("Get Artist's Albums", () => {
		it("should get all the artist's albums", () => {
			return request(app.getHttpServer())
				.get(`/albums?artist=${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
				});
		});
		it("should get all albums, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/albums?artist=${dummyRepository.artistB.id}&with=artist`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumB1),
						artist: expectedArtistResponse(dummyRepository.artistB),
					});
				});
		});
	});

	describe("Update the album", () => {
		it("should reassign the compilation album to an artist + change the type", () => {
			return request(app.getHttpServer())
				.put(`/albums/${dummyRepository.compilationAlbumA.slug}`)
				.send({
					type: "RemixAlbum",
				})
				.expect(200)
				.expect((res) => {
					const artist: Album = res.body;
					expect(artist).toStrictEqual({
						...expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
						type: "RemixAlbum",
					});
				});
		});

		it("should change release date", () => {
			return request(app.getHttpServer())
				.put(`/albums/${dummyRepository.compilationAlbumA.id}`)
				.send({
					releaseDate: new Date(2024, 0, 2),
				})
				.expect(200)
				.expect((res) => {
					const artist: Album = res.body;
					expect(artist).toStrictEqual({
						...expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
						releaseDate: "2024-01-02T00:00:00.000Z",
						type: "RemixAlbum",
					});
				});
		});
		it("should add genres", async () => {
			await request(app.getHttpServer())
				.put(`/albums/${dummyRepository.compilationAlbumA.id}`)
				.send({
					genres: ["Genre 1", "Genre 2", "Genre 3", "Genre 2"],
				})
				.expect(200);
			await request(app.getHttpServer())
				.get(
					`/albums/${dummyRepository.compilationAlbumA.id}?with=genres`,
				)
				.expect((res) => {
					const genres = res.body.genres.map(
						(genre: Genre) => genre.name,
					);
					expect(genres).toStrictEqual([
						"Genre 1",
						"Genre 2",
						"Genre 3",
					]);
				});
		});
		it("should set release as master", async () => {
			await request(app.getHttpServer())
				.put(`/albums/${dummyRepository.albumA1.id}`)
				.send({
					masterReleaseId: dummyRepository.releaseA1_2.id,
				})
				.expect(200)
				.expect((res) => {
					const releaseId = res.body.masterId;
					expect(releaseId).toBe(dummyRepository.releaseA1_2.id);
				});
			// teardown
			await dummyRepository.album.update({
				where: { id: dummyRepository.albumA1.id },
				data: { masterId: dummyRepository.releaseA1_1.id },
			});
		});

		it("should no set release as master (unrelated release)", () => {
			return request(app.getHttpServer())
				.put(`/albums/${dummyRepository.albumA1.id}`)
				.send({
					masterReleaseId: dummyRepository.releaseB1_1.id,
				})
				.expect(400);
		});
	});

	describe("Album Illustration", () => {
		it("Should return the illustration", async () => {
			const { illustration } =
				await dummyRepository.releaseIllustration.create({
					data: {
						release: {
							connect: { id: dummyRepository.releaseA1_1.id },
						},
						hash: "a",
						illustration: {
							create: {
								type: IllustrationType.Cover,
								blurhash: "A",
								aspectRatio: 1,
								colors: ["B"],
							},
						},
					},
					include: { illustration: true },
				});
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}?with=illustration`)
				.expect(200)
				.expect((res) => {
					const album: Album = res.body;
					expect(album).toStrictEqual({
						...album,
						illustration: {
							...illustration,
							url: `/illustrations/${illustration.id}`,
						},
					});
				});
		});
	});
});
