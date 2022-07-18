import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, Release } from "@prisma/client";
import request from "supertest";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { createTestingModule } from "test/TestModule";
import AlbumModule from "./album.module";
import AlbumService from "./album.service";
import MetadataModule from "src/metadata/metadata.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import SetupApp from "test/SetupApp";
import IllustrationModule from "src/illustration/illustration.module";

describe('Album Controller', () => {
	let albumService: AlbumService;
	let artistService: ArtistService;
	let releaseService: ReleaseService;
	let app: INestApplication;

	let artist: Artist;
	let album1: Album;
	let album2: Album;
	let album3: Album;
	let compilationAlbum: Album;
	let release1: Release;
	let release2: Release;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [ArtistModule, AlbumModule, PrismaModule, ReleaseModule, MetadataModule, SongModule, TrackModule, IllustrationModule],
			providers: [ArtistService, ReleaseService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		app = await SetupApp(module);
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
		releaseService = module.get<ReleaseService>(ReleaseService);
		artist = await artistService.createArtist({ name: 'My Artist 1' });
		album1 = await albumService.createAlbum({ artist: { id: artist.id }, name: 'My Album 1' });
		album2 = await albumService.createAlbum({ artist: { id: artist.id }, name: 'My Album 2' });
		album3 = await albumService.createAlbum({ artist: { id: artist.id }, name: 'My Album 3' });
		compilationAlbum = await albumService.createAlbum({ name: 'My Compilation Album' });
		release1 = await releaseService.createRelease({
			title: "My Release 1", album: { byId: { id: album1.id } },
			master: true
		});
		release2 = await releaseService.createRelease({
			title: "My Release 2", album: { byId: { id: album1.id } },
			master: false
		});
	});

	describe("Get Albums (GET /albums)", () => {
		it("Should return all albums", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(4);
					expect(albums[0]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`
					});
					expect(albums[1]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`
					})
					expect(albums[2]).toStrictEqual({
						...album3,
						illustration: `http://meelo.com/albums/${album3.id}/illustration`
					});
					expect(albums[3]).toStrictEqual({
						...compilationAlbum,
						illustration: `http://meelo.com/albums/${compilationAlbum.id}/illustration`
					})
				});
		});
		it("Should sort all albums", () => {
			return request(app.getHttpServer())
				.get(`/albums?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(4);
					expect(albums[0].id).toBe(compilationAlbum.id);
					expect(albums[1].id).toBe(album3.id);
					expect(albums[2].id).toBe(album2.id);
					expect(albums[3].id).toBe(album1.id);
				});
		});
		it("Should return some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/albums?skip=1&take=2`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`
					})
					expect(albums[1]).toStrictEqual({
						...album3,
						illustration: `http://meelo.com/albums/${album3.id}/illustration`
					});
				});
		});
		it("Should include related artist", () => {
			return request(app.getHttpServer())
				.get(`/albums?with=artist&take=1`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration`,
						}
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
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...compilationAlbum,
						illustration: `http://meelo.com/albums/${compilationAlbum.id}/illustration`,
					});
				});
		});
	});

	describe("Get Album (GET /albums/:id)", () => {
		it("Should return album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album1.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`
					})
				});
		});

		it("Should return album (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${artist.slug}+${album1.slug}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`
					})
				});
		});
		it("Should return compilation album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${compilationAlbum.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...compilationAlbum,
						illustration: `http://meelo.com/albums/${compilationAlbum.id}/illustration`
					})
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/-1`)
				.expect(404);
		});
		it("Should include related artist", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album2.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration`
						}
					})
				});
		});
		it("Should include related artist (null)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${compilationAlbum.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...compilationAlbum,
						illustration: `http://meelo.com/albums/${compilationAlbum.id}/illustration`,
						artist: null
					})
				});
		});
		it("Should return an error as the string is badly fored", () => {
			return request(app.getHttpServer())
				.get(`/albums/${artist.slug}`)
				.expect(400);
		});
	});

	describe("Get Album's Master (GET /albums/:id/master)", () => {
		it("Should return album's master", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album1.id}/master`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					})
				});
		});
		it("Should return album's master (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${artist.slug}+${album1.slug}/master`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					})
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
				.get(`/albums/${album1.id}/master?with=tracks`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						...release1,
						tracks: [],
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					})
				});
		});
	});

	describe("Get Album's Releases (GET /albums/:id/releases)", () => {
		it("Should return all album's releases", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album1.id}/releases`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					});
					expect(releases[1]).toStrictEqual({
						...release2,
						illustration: `http://meelo.com/releases/${release2.id}/illustration`
					})
				});
		});
		it("Should return all album's releases, sorted by id, desc", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album1.id}/releases?sortBy=id&order=desc`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[1]).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					});
					expect(releases[0]).toStrictEqual({
						...release2,
						illustration: `http://meelo.com/releases/${release2.id}/illustration`
					})
				});
		});
		it("Should return all album's releases (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${artist.slug}+${album1.slug}/releases`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					});
					expect(releases[1]).toStrictEqual({
						...release2,
						illustration: `http://meelo.com/releases/${release2.id}/illustration`
					})
				});
		});
		it("Should return some album's releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album1.id}/releases?take=1`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`
					});
				});
		});
		it("Should return an error, as the album does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/-1/releases`)
				.expect(404);
		});
		it("Should include related tracks & parent album", () => {
			return request(app.getHttpServer())
				.get(`/albums/${album1.id}/releases?skip=1&with=tracks,album`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual({
						...release2,
						illustration: `http://meelo.com/releases/${release2.id}/illustration`,
						tracks: [],
						album: {
							...album1,
							illustration: `http://meelo.com/albums/${album1.id}/illustration`,
						}
					});
				});
		});
	});

	describe("Get Tracklist Album", () => {

		it("should return an error, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/albums/${-1}/master/tracklist`)
				.expect(404);
		});
	});
});