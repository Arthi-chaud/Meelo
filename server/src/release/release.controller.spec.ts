import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import ParserModule from "src/parser/parser.module";
import { IllustrationType } from "src/prisma/generated/client";
import type {
	Album,
	Release,
	ReleaseWithRelations,
	Track,
} from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import request from "supertest";
import {
	expectedAlbumResponse,
	expectedArtistResponse,
	expectedReleaseResponse,
	expectedSongResponse,
	expectedTrackResponse,
	expectedVideoResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import ReleaseController from "./release.controller";
import ReleaseModule from "./release.module";
import ReleaseService from "./release.service";

jest.setTimeout(60000);

describe("Release Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

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
				FileModule,
				ParserModule,
				GenreModule,
			],
			providers: [
				ReleaseService,
				AlbumService,
				ArtistService,
				ReleaseController,
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

	describe("Get Releases (GET /releases)", () => {
		it("should return every releases", () => {
			return request(app.getHttpServer())
				.get("/releases")
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
					expect(releases[1]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_2),
					);
					expect(releases[2]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseB1_1),
					);
					expect(releases[3]).toStrictEqual(
						expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
					);
				});
		});

		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get("/releases?sortBy=name")
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
					expect(releases[1]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_2),
					);
					expect(releases[2]).toStrictEqual(
						expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
					);
					expect(releases[3]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseB1_1),
					);
				});
		});

		it("should return some releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get("/releases?take=1&skip=2")
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseB1_1),
					);
				});
		});

		it("should return releases w/ related albums", () => {
			return request(app.getHttpServer())
				.get("/releases?with=album")
				.expect(200)
				.expect((res) => {
					const releases: (Release & { album: Album })[] =
						res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1),
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1),
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseB1_1),
						album: expectedAlbumResponse(dummyRepository.albumB1),
					});
					expect(releases[3]).toStrictEqual({
						...expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
						album: expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					});
				});
		});
	});

	describe("Get Release (GET /release/:id)", () => {
		it("should return the release", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body;
					expect(release).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
				});
		});

		it("should return the compilation release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.compilationReleaseA1.slug}`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body;
					expect(release).toStrictEqual(
						expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
					);
				});
		});

		it("should return the release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.slug}`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body;
					expect(release).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_2),
					);
				});
		});

		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer()).get("/releases/-1").expect(404);
		});

		it("should return the release, w/ parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}?with=album`)
				.expect(200)
				.expect((res) => {
					const release: Release & { album: Album; tracks: Track[] } =
						res.body;
					expect(release.id).toBe(dummyRepository.releaseA1_2.id);
					expect(release.album).toStrictEqual(
						expectedAlbumResponse(dummyRepository.albumA1),
					);
				});
		});

		it("should get the release with disc", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_1.id}?with=discs`)
				.expect(200)
				.expect((res) => {
					const release: ReleaseWithRelations = res.body;
					const disc = release.discs![0];
					expect(disc.index).toBe(1);
					expect(disc.name).toBeNull();
				});
		});
	});

	describe("Get Releases by Album", () => {
		it("Should return all album's releases", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.albumA1.id}`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
					expect(releases[1]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_2),
					);
				});
		});
		it("Should return all album's releases, sorted by id, desc", () => {
			return request(app.getHttpServer())
				.get(
					`/releases?album=${dummyRepository.albumA1.id}&sortBy=id&order=desc`,
				)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_2),
					);
					expect(releases[1]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
				});
		});
		it("Should return all album's releases (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.albumB1.slug}`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseB1_1),
					);
				});
		});
		it("Should return some album's releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.albumA1.id}&take=1`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
				});
		});
		it("Should include parent album", () => {
			return request(app.getHttpServer())
				.get(
					`/releases?album=${dummyRepository.compilationAlbumA.id}&with=album`,
				)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
						album: expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					});
				});
		});
	});

	describe("Get releases by label", () => {
		it("should return releases by label", () => {
			return request(app.getHttpServer())
				.get(`/releases?sortBy=id&label=${dummyRepository.labelA.id}`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0].id).toBe(dummyRepository.releaseA1_1.id);
					expect(releases[1].id).toBe(dummyRepository.releaseB1_1.id);
				});
		});

		it("should return releases by label (using not:)", () => {
			return request(app.getHttpServer())
				.get(
					`/releases?sortBy=id&label=not:${dummyRepository.labelA.id}`,
				)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0].id).toBe(dummyRepository.releaseA1_2.id);
					expect(releases[1].id).toBe(
						dummyRepository.compilationReleaseA1.id,
					);
				});
		});

		it("should return releases by label (using or: )", () => {
			return request(app.getHttpServer())
				.get(
					`/releases?sortBy=id&label=or:${dummyRepository.labelA.id},${dummyRepository.labelB.slug}`,
				)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases[0].id).toBe(dummyRepository.releaseA1_1.id);
					expect(releases[1].id).toBe(dummyRepository.releaseA1_2.id);
					expect(releases[2].id).toBe(dummyRepository.releaseB1_1.id);
				});
		});
		// TODO
		// it("should error: cannot use 'and:'", () => {
		// 	return request(app.getHttpServer())
		// 		.get(
		// 			`/releases?sortBy=id&label=and:${dummyRepository.labelA.id},${dummyRepository.labelB.slug}`,
		// 		)
		// 		.expect(400);
		// });
	});

	describe("Get Releases by library", () => {
		it("should return every releases, w/ tracks & parent album", () => {
			return request(app.getHttpServer())
				.get(
					`/releases?library=${dummyRepository.library1.id}&with=album`,
				)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1),
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1),
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
						album: expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					});
				});
		});
		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get(
					`/releases?library=${dummyRepository.library1.id}&sortBy=name&order=desc&with=album`,
				)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(
							dummyRepository.compilationReleaseA1,
						),
						album: expectedAlbumResponse(
							dummyRepository.compilationAlbumA,
						),
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1),
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1),
					});
				});
		});
	});

	describe("Get Tracklist", () => {
		it("should get the tracklist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracklist`)
				.expect(200)
				.expect((res) => {
					const tracklist = res.body.items;
					expect(tracklist).toStrictEqual([
						{
							...expectedTrackResponse(dummyRepository.trackA2_1),
							illustration: null,
							video: null,
							song: expectedSongResponse(dummyRepository.songA2),
						},
						{
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
							illustration: null,
							video: expectedVideoResponse(
								dummyRepository.videoA1,
							),
							song: expectedSongResponse(dummyRepository.songA1),
						},
					]);
				});
		});

		it("should get the tracklist, w/ related song artist", () => {
			return request(app.getHttpServer())
				.get(
					`/releases/${dummyRepository.releaseA1_2.id}/tracklist?with=artist`,
				)
				.expect(200)
				.expect((res) => {
					const tracklist = res.body.items;
					expect(tracklist).toStrictEqual([
						{
							...expectedTrackResponse(dummyRepository.trackA2_1),
							illustration: null,
							video: null,
							song: {
								...expectedSongResponse(dummyRepository.songA2),
								artist: expectedArtistResponse(
									dummyRepository.artistA,
								),
							},
						},
						{
							...expectedTrackResponse(
								dummyRepository.trackA1_2Video,
							),
							video: {
								...expectedVideoResponse(
									dummyRepository.videoA1,
								),
								artist: expectedArtistResponse(
									dummyRepository.artistA,
								),
							},
							illustration: null,
							song: {
								...expectedSongResponse(dummyRepository.songA1),
								artist: expectedArtistResponse(
									dummyRepository.artistA,
								),
							},
						},
					]);
				});
		});

		it("should return an error, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${-1}/tracklist`)
				.expect(404);
		});
	});

	describe("Get Albums's Master (GET /releases/master/:id)", () => {
		it("Should return album's master", () => {
			return request(app.getHttpServer())
				.get(`/releases/master/${dummyRepository.albumA1.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
				});
		});
		it("Should return album's master (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/releases/master/${dummyRepository.albumA1.slug}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(
						expectedReleaseResponse(dummyRepository.releaseA1_1),
					);
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer())
				.get("/releases/master/-1")
				.expect(404);
		});
		it("Should throw, as the album does not have releases", async () => {
			const tmpAlbum = await module
				.get(AlbumService)
				.create({ name: "A" });
			return request(app.getHttpServer())
				.get(`/releases/master/${tmpAlbum.id}`)
				.expect(404);
		});
		it("Should include related album", () => {
			return request(app.getHttpServer())
				.get(
					`/releases/master/${dummyRepository.albumB1.id}?with=album`,
				)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseB1_1),
						album: expectedAlbumResponse(dummyRepository.albumB1),
					});
				});
		});
	});

	describe("Release Illustration", () => {
		it("Should return the illustration", async () => {
			const { illustration } =
				await dummyRepository.releaseIllustration.create({
					data: {
						release: {
							connect: { id: dummyRepository.releaseA1_2.id },
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
					`/releases/${dummyRepository.releaseA1_2.id}?with=illustration`,
				)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body;
					expect(release).toStrictEqual({
						...release,
						illustration: {
							...illustration,
							url: `/illustrations/${illustration.id}`,
						},
					});
				});
		});
	});
});
