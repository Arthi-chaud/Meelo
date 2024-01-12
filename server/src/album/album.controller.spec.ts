import { type INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist } from "src/prisma/models";
import request from "supertest";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import { createTestingModule } from "test/test-module";
import AlbumModule from "./album.module";
import ScannerModule from "src/scanner/scanner.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import SetupApp from "test/setup-app";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import FileModule from "src/file/file.module";
import AlbumService from "./album.service";
import {
	expectedAlbumResponse,
	expectedArtistResponse,
	expectedReleaseResponse,
} from "test/expected-responses";
import ProviderService from "src/providers/provider.service";
import SettingsService from "src/settings/settings.service";
import ProvidersModule from "src/providers/providers.module";

jest.setTimeout(60000);

describe("Album Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let albumService: AlbumService;
	let providerService: ProviderService;
	let module: TestingModule;
	let album1: Album;
	let album2: Album;
	let album3: Album;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				ArtistModule,
				AlbumModule,
				PrismaModule,
				ReleaseModule,
				ScannerModule,
				SongModule,
				TrackModule,
				IllustrationModule,
				GenreModule,
				FileModule,
				ProvidersModule,
			],
			providers: [ArtistService, ReleaseService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		albumService = module.get(AlbumService);
		await dummyRepository.onModuleInit();
		providerService = module.get(ProviderService);
		module.get(SettingsService).loadFromFile();
		await providerService.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Get Albums (GET /albums)", () => {
		it("Should return all albums", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
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
		it("Should return best-of albums only", () => {
			return request(app.getHttpServer())
				.get(`/albums?type=Compilation`)
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
				.get(`/albums?sortBy=name&order=desc`)
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
				.get(`/albums?skip=1&take=1`)
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
				.get(`/albums?with=artist&take=1`)
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
				.get(`/albums?artist=compilations`)
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
				.get(
					`/albums/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}`,
				)
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
			return request(app.getHttpServer()).get(`/albums/-1`).expect(404);
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
		it("should return album w/ external ID", async () => {
			const provider = await dummyRepository.provider.findFirstOrThrow();
			await dummyRepository.albumExternalId.create({
				data: {
					albumId: dummyRepository.albumA1.id,
					providerId: provider.id,
					description: "Album blah blah blah",
					value: "1234",
				},
			});
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}?with=externalIds`)
				.expect(200)
				.expect((res) => {
					const album: Album = res.body;
					expect(album).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						externalIds: [
							{
								provider: {
									name: provider.name,
									homepage: providerService
										.getProviderById(provider.id)
										.getProviderHomepage(),
									banner: `/illustrations/providers/${provider.name}/banner`,
									icon: `/illustrations/providers/${provider.name}/icon`,
								},
								description: "Album blah blah blah",
								value: "1234",
								rating: null,
								url: providerService
									.getProviderById(provider.id)
									.getAlbumURL("1234"),
							},
						],
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
		it("Should return an error as the string is badly fored", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.artistA.slug}`)
				.expect(400);
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
				.post(
					`/albums/compilations+${dummyRepository.compilationAlbumA.slug}`,
				)
				.send({
					artistId: dummyRepository.artistB.id,
					type: "RemixAlbum",
				})
				.expect(201)
				.expect((res) => {
					const artist: Album = res.body;
					expect(artist).toStrictEqual({
						...expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
						artistId: dummyRepository.artistB.id,
						type: "RemixAlbum",
					});
				});
		});

		it("should reassign the album as a compilation", () => {
			return request(app.getHttpServer())
				.post(`/albums/${dummyRepository.compilationAlbumA.id}`)
				.send({
					artistId: null,
				})
				.expect(201)
				.expect((res) => {
					const artist: Album = res.body;
					expect(artist).toStrictEqual({
						...expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
						artistId: null,
						type: "RemixAlbum",
					});
				});
		});
	});

	describe("Album Illustration", () => {
		it("Should return the illustration", async () => {
			const illustration =
				await dummyRepository.releaseIllustration.create({
					data: {
						releaseId: dummyRepository.releaseA1_1.id,
						blurhash: "A",
						hash: "AAA",
						aspectRatio: 1,
						colors: ["B"],
					},
				});
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}`)
				.expect(200)
				.expect((res) => {
					const album: Album = res.body;
					expect(album).toStrictEqual({
						...album,
						illustration: {
							...illustration,
							hash: "AAA",
							url:
								"/illustrations/releases/" +
								dummyRepository.releaseA1_1.id,
						},
					});
				});
		});
	});
});
