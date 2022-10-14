import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, Release, Track } from "src/prisma/models";
import request from "supertest";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import AlbumModule from "./album.module";
import MetadataModule from "src/metadata/metadata.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import SetupApp from "test/setup-app";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import type ReassignAlbumDTO from "./models/reassign-album.dto";

describe('Album Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	const expectedArtistResponse = (artist: Artist) => ({
		...artist,
		illustration: null
	});

	const expectedAlbumResponse = (album: Album) => ({
		...album,
		releaseDate: album.releaseDate?.toISOString() ?? null,
		illustration: null
	});

	const expectedReleaseResponse = (release: Release) => ({
		...release,
		releaseDate: release.releaseDate?.toISOString() ?? null,
		illustration: null
	});

	const expectedTrackResponse = (track: Track) => ({
		...track,
		illustration: null,
		stream: `/files/${track.sourceFileId}/stream`
	});

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [ArtistModule, AlbumModule, PrismaModule, ReleaseModule, MetadataModule, SongModule, TrackModule, IllustrationModule, GenreModule],
			providers: [ArtistService, ReleaseService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	describe("Get Albums (GET /albums)", () => {
		it("Should return all albums", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(3);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
					expect(albums[1]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1));
					expect(albums[2]).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
				});
		});
		it("Should sort all albums", () => {
			return request(app.getHttpServer())
				.get(`/albums?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(3);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1));
					expect(albums[1]).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
					expect(albums[2]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});
		it("Should return some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/albums?skip=1&take=1`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1));
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
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
				});
		});
	});

	describe("Get Compilations Albums (GET /albums/compilations)", () => {
		it("Should return all albums", () => {
			return request(app.getHttpServer())
				.get(`/albums/compilations`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
				});
		});
	});

	describe("Get Album (GET /albums/:id)", () => {
		it("Should return album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumB1.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1))
				});
		});

		it("Should return album (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1))
				});
		});
		it("Should return compilation album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.compilationAlbumA.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA))
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/-1`)
				.expect(404);
		});
		it("Should include related artist", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumB1.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumB1),
						artist: expectedArtistResponse(dummyRepository.artistB)
					})
				});
		});
		it("Should include related artist (null)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.compilationAlbumA.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.compilationAlbumA),
						artist: null
					})
				});
			});
		it("Should return an error as the string is badly fored", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.artistA.slug}`)
				.expect(400);
		});
	});

	describe("Get Album's Master (GET /albums/:id/master)", () => {
		it("Should return album's master", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}/master`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1))
				});
		});
		it("Should return album's master (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}/master`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1))
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/-1/master`)
				.expect(404);
		});
		it("Should return an error, as the id is not valid", () => {
			return request(app.getHttpServer())
				.get(`/albums/plop/releases`)
				.expect(400);
		});
		it("Should include related tracks", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumB1.id}/master?with=tracks`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseB1_1),
						tracks: [
							expectedTrackResponse(dummyRepository.trackB1_1)
						],
					})
				});
		});
	});

	describe("Get Album's Releases (GET /albums/:id/releases)", () => {
		it("Should return all album's releases", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}/releases`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
				});
		});
		it("Should return all album's releases, sorted by id, desc", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}/releases?sortBy=id&order=desc`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
				});
		});
		it("Should return all album's releases (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.artistB.slug}+${dummyRepository.albumB1.slug}/releases`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
				});
		});
		it("Should return some album's releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}/releases?take=1`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/-1/releases`)
				.expect(404);
		});
		it("Should include related tracks & parent album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.compilationAlbumA.id}/releases?with=tracks,album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						tracks: [
							expectedTrackResponse(dummyRepository.trackC1_1),
						],
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
				});
		});
	});

	describe("Get Album's genres (GET /albums/:id/genres", () => {
		it("should return an error, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/${-1}/genres`)
				.expect(404);
		});

		it("should return an array of genres", () => {
			return request(app.getHttpServer())
				.get(`/albums/${dummyRepository.albumA1.id}/genres`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body;
					expect(releases).toStrictEqual([
						dummyRepository.genreB,
						dummyRepository.genreA
					])
				});
		});
	});

	describe("Reassign the album (POST /albums/reassign)", () => {
		it("should reassign the compilation album to an artist", () => {
			return request(app.getHttpServer())
				.post(`/albums/reassign`)
				.send(<ReassignAlbumDTO>{
					albumId: dummyRepository.compilationAlbumA.id,
					artistId: dummyRepository.artistB.id
				})
				.expect(201)
				.expect((res) => {
					const artist: Album = res.body;
					expect(artist).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.compilationAlbumA),
						artistId: dummyRepository.artistB.id
					});
				});
		});

		it("should reassign the album as a compilation", () => {
			return request(app.getHttpServer())
				.post(`/albums/reassign`)
				.send(<ReassignAlbumDTO>{
					albumId: dummyRepository.compilationAlbumA.id,
					artistId: null
				})
				.expect(201)
				.expect((res) => {
					const artist: Album = res.body;
					expect(artist).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.compilationAlbumA),
						artistId: null
					});
				});
		});
	});
});