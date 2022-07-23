import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Release, Song, Track } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
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
import LibraryModule from "src/library/library.module";
import type Tracklist from "src/track/models/tracklist.model";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";

describe('Release Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	const expectedReleaseResponse = (release: Release) => ({
		...release,
		illustration: `http://meelo.com/releases/${release.id}/illustration`
	});
	const expectedAlbumResponse = (album: Album) => ({
		...album,
		releaseDate: album.releaseDate?.toISOString() ?? null,
		illustration: `http://meelo.com/albums/${album.id}/illustration`
	});
	const expectedTrackResponse = (track: Track) => ({
		...track,
		illustration: `http://meelo.com/tracks/${track.id}/illustration`,
		stream: `http://meelo.com/files/${track.id}/stream`
	});
	const expectedSongResponse = (song: Song) => ({
		...song,
		illustration: `http://meelo.com/songs/${song.id}/illustration`
	}); 

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, LibraryModule, TrackModule, IllustrationModule, SongModule, MetadataModule, GenreModule],
			providers: [ReleaseService, AlbumService, ArtistService, ReleaseController],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = module.createNestApplication();
		app.useGlobalFilters(
			new NotFoundExceptionFilter(),
			new MeeloExceptionFilter()
		);
		app.useGlobalPipes(new ValidationPipe());
		await app.init();
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	describe('Get Releases (GET /releases)', () => {

		it("should return every releases", () => {
			return request(app.getHttpServer())
				.get('/releases')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
					expect(releases[2]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
					expect(releases[3]).toStrictEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
				});
		});

		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get('/releases?sortBy=title')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
					expect(releases[2]).toStrictEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
					expect(releases[3]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
				});
		});

		it("should return some releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get('/releases?take=1&skip=2')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
				});
		});

		it("should return releases w/ related albums", () => {
			return request(app.getHttpServer())
				.get('/releases?with=album')
				.expect(200)
				.expect((res) => {
					let releases: (Release & { album: Album }) [] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseB1_1),
						album: expectedAlbumResponse(dummyRepository.albumB1)
					});
					expect(releases[3]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
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
					let release: Release = res.body
					expect(release).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
				});
		});

		it("should return the compilation release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/compilations+${dummyRepository.compilationAlbumA.slug}+${dummyRepository.compilationReleaseA1.slug}`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
				});
		});

		it("should return the release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}+${dummyRepository.releaseA1_2.slug}`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
				});
		});

		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/-1`)
				.expect(404);
		});

		it("should return an error, as the string is badly formed", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.artistA.slug}`)
				.expect(400);
		});

		it("should return the release, w/ tracks and parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}?with=tracks,album`)
				.expect(200)
				.expect((res) => {
					let release: Release & { album: Album, tracks: Track[] } = res.body
					expect(release.id).toBe(dummyRepository.releaseA1_2.id);
					expect(release.tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
					expect(release.tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA2_1));
					expect(release.album).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});
	});

	describe("Get Related Tracks", () => {
		it("should get all the tracks (2 expected)", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracks`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA2_1));
				});
		});
		it("should get all the tracks (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_1.id}/tracks`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA1_1));
				});
		});
		it("should get all the tracks, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracks?sortBy=displayName`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA2_1));
					expect(tracks[1]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});
		it("should get some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracks?skip=1&sortBy=displayName`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});
		it("should get tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_1.id}/tracks?with=song`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						song: expectedSongResponse(dummyRepository.songA1)
					});
				});
		});
		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${-1}/tracks`)
				.expect(404);
		});
	});

	describe("Get Tracklist", () => {
		it("should get the tracklist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracklist`)
				.expect(200)
				.expect((res) => {
					let tracklist: Tracklist = res.body;
					expect(tracklist).toStrictEqual({
						'1': [expectedTrackResponse(dummyRepository.trackA2_1)],
						'2': [expectedTrackResponse(dummyRepository.trackA1_2Video)],
					});
				});
		});

		it("should get the tracklist, w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracklist?with=song`)
				.expect(200)
				.expect((res) => {
					let tracklist: Tracklist = res.body;
					expect(tracklist).toStrictEqual({
						'1': [{
							...expectedTrackResponse(dummyRepository.trackA2_1),
							song: expectedSongResponse(dummyRepository.songA2)
						}],
						'2': [{
							...expectedTrackResponse(dummyRepository.trackA1_2Video),
							song: expectedSongResponse(dummyRepository.songA1)
						}],
					});
				});
		});

		it("should return an error, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${-1}/tracklist`)
				.expect(404);
		});
	});

	describe("Get Related Album", () => {
		it("should get the album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseB1_1.id}/album`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1));
				});
		});
		it("should get the compilation album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.compilationReleaseA1.id}/album`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
				});
		});
		it("should get album w/ related releases", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/album?with=releases`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						releases: [
							expectedReleaseResponse(expectedReleaseResponse(dummyRepository.releaseA1_1)),
							expectedReleaseResponse(expectedReleaseResponse(dummyRepository.releaseA1_2))
						]
					});
				});
		});
		it("should get album w/ parent artist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseB1_1.id}/album?with=artist`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumB1),
						artist: {
							...dummyRepository.artistB,
							illustration: `http://meelo.com/artists/${dummyRepository.artistB.id}/illustration`
						}
					});
				});
		});
		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/-1/album`)
				.expect(404);
		});
	});

	
});