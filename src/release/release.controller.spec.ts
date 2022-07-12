import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Release, Track } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import ReleaseService from "./release.service";
import ReleaseController from "./release.controller";
import request from "supertest";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import ReleaseModule from "./release.module";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import SongModule from "src/song/song.module";
import MetadataModule from "src/metadata/metadata.module";

describe('Release Controller', () => {
	let releaseService: ReleaseService;
	let releaseController: ReleaseController;
	let albumService: AlbumService;
	let album: Album;
	let compilationAlbum: Album;
	let standardRelease: Release & { album: Album };
	let deluxeRelease: Release & { album: Album };
	let editedRelease: Release & { album: Album };
	let compilationRelease: Release & { album: Album };
	let app: INestApplication;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, TrackModule, IllustrationModule, SongModule, MetadataModule],
			providers: [ReleaseService, AlbumService, ArtistService, ReleaseController],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		app = module.createNestApplication();
		app.useGlobalFilters(
			new NotFoundExceptionFilter(),
			new MeeloExceptionFilter()
		);
		app.useGlobalPipes(new ValidationPipe());
		await app.init();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		releaseService = module.get<ReleaseService>(ReleaseService);
		releaseController = module.get<ReleaseController>(ReleaseController);
		albumService = module.get<AlbumService>(AlbumService);
		let artist = await module.get<ArtistService>(ArtistService).createArtist({ name: 'My Artist' });
		album = await albumService.createAlbum(
			{ name: 'My Album', artist: { id: artist.id } }
		);
		compilationAlbum = await albumService.createAlbum(
			{ name: 'My Compilation' },
			{ artist: true, releases: true }
		);
		compilationRelease = await releaseService.createRelease({
			title: "My Compilation (Album)",
			master: true,
			album: { byId: { id: compilationAlbum.id } }
		});
		standardRelease = await releaseService.createRelease({
			title: "My Album",
			master: true,
			album: { byId: { id: album.id } }
		});
		deluxeRelease = await releaseService.createRelease({
			title: "My Album (Deluxe Edition)",
			master: false,
			album: { byId: { id: album.id } }
		});
		editedRelease = await releaseService.createRelease({
			title: "My Album (Edited Edition)",
			master: false,
			album: { byId: { id: album.id } }
		});
	});

	it("should be defined", () => {
		expect(releaseController).toBeDefined();
	});

	describe('Get Releases (GET /releases)', () => {

		it("should return every releases", () => {
			return request(app.getHttpServer())
				.get('/releases')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(compilationRelease);
					expect(releases[1]).toStrictEqual(standardRelease);
					expect(releases[2]).toStrictEqual(deluxeRelease);
					expect(releases[3]).toStrictEqual(editedRelease);
				});
		});

		it("should return some releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get('/releases?take=1&skip=2')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body
					expect(releases.length).toBe(1);
					expect(releases[0].id).toBe(deluxeRelease.id);
				});
		});

		it("should return releases w/ related albums", () => {
			return request(app.getHttpServer())
				.get('/releases?with=album')
				.expect(200)
				.expect((res) => {
					let releases: (Release & { album: Album })[] = res.body
					expect(releases[0].id).toBe(compilationRelease.id);
					expect(releases[0].album.id).toBe(compilationAlbum.id);
					expect(releases[1].id).toBe(standardRelease.id);
					expect(releases[1].album.id).toBe(album.id);
					expect(releases[2].id).toBe(deluxeRelease.id);
					expect(releases[2].album.id).toBe(album.id);
					expect(releases[3].id).toBe(editedRelease.id);
					expect(releases[3].album.id).toBe(album.id);
				});
		});
	});

	describe("Get Release By Id (GET /release/:id)", () => {
		it("should return the release", () => {
			return request(app.getHttpServer())
				.get(`/releases/${compilationRelease.id}`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual(compilationRelease)
				});
		});

		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/-1`)
				.expect(404);
		});

		it("should return the release, w/ tracks and parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}?with=tracks,album`)
				.expect(200)
				.expect((res) => {
					let release: Release & { album: Album, tracks: Track[] } = res.body
					expect(release.id).toBe(deluxeRelease.id);
					expect(release.tracks).toStrictEqual([]);
					expect(release.album).toStrictEqual(album);
				});
		});
	});

	describe("Get Release By Slugs (GET /release/:artist/:album/:release)", () => {
		it("should return the release", () => {
			return request(app.getHttpServer())
				.get(`/releases/my-artist/my-album/my-album-deluxe-edition`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual(deluxeRelease);
				});
		});
		it("should return the release", () => {
			return request(app.getHttpServer())
				.get(`/releases/compilations/my-compilation/my-compilation-album`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual(compilationRelease);
				});
		});

		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/bla/bla/bla`)
				.expect(404);
		});

		it("should return the release, with album", () => {
			return request(app.getHttpServer())
				.get(`/releases/my-artist/my-album/my-album-edited-edition?with=album`)
				.expect(200)
				.expect((res) => {
					let release: Release & { album: Album }= res.body
					expect(release.id).toStrictEqual(editedRelease.id);
					expect(release.album).toStrictEqual(album);
				});
		});
	});

	describe("Get Album's Releases (GET /release/:artist/:album)", () => {
		it("should return the album releases", () => {
			return request(app.getHttpServer())
				.get(`/releases/my-artist/my-album`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body
					expect(releases.length).toBe(3);
					expect(releases[0]).toStrictEqual(standardRelease);
					expect(releases[1]).toStrictEqual(deluxeRelease);
					expect(releases[2]).toStrictEqual(editedRelease);
				});
		});

		it("should return the compilation album releases", () => {
			return request(app.getHttpServer())
				.get(`/releases/compilations/my-compilation`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(compilationRelease);
				});
		});

		it("should return some album releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/releases/my-artist/my-album?take=1&skip=1`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(deluxeRelease);
				});
		});

		it("should return the album releases, with their tracks", () => {
			return request(app.getHttpServer())
				.get(`/releases/my-artist/my-album?with=tracks`)
				.expect(200)
				.expect((res) => {
					let releases: (Release & { tracks: Track[] }) [] = res.body
					expect(releases.length).toBe(3);
					expect(releases[0].id).toStrictEqual(standardRelease.id);
					expect(releases[0].tracks).toStrictEqual([]);
					expect(releases[1].id).toStrictEqual(deluxeRelease.id);
					expect(releases[1].tracks).toStrictEqual([]);
					expect(releases[2].id).toStrictEqual(editedRelease.id);
					expect(releases[2].tracks).toStrictEqual([]);
				});
		});
	});
});