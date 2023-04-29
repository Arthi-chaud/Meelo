import { INestApplication } from "@nestjs/common";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import LibraryController from "./library.controller";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";
import IllustrationModule from "src/illustration/illustration.module";
import request from 'supertest';
import type { Album, Artist, Library, Release, Song, Track } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";
import TasksModule from "src/tasks/tasks.module";
import SetupApp from "test/setup-app";
import { SongWithVideoResponse } from "src/song/models/song-with-video.response";
import { expectedArtistResponse, expectedAlbumResponse, expectedSongResponse, expectedTrackResponse, expectedReleaseResponse } from "test/expected-responses";
describe('Library Controller', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let newLibrary: Library;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [LibraryModule, FileManagerModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule, GenreModule, LyricsModule, TasksModule],
			providers: [LibraryController, LibraryService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		
	});

	afterAll(() => {
		module.close();
		app.close();
	});

	describe('Create Library (POST /libraries/new)', () => {
		it("should create a library", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: 'Music 3/',
					name: 'My New Library'
				})
				.expect(201)
				.expect((res) => {
					const library = res.body;
					expect(library.id).toBeDefined();
					expect(library.slug).toBe('my-new-library');
					expect(library.name).toBe('My New Library');
					expect(library.path).toBe('Music 3');
					newLibrary = library;
				});
		});
		it("should fail, as the body is incomplete", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Path',
				})
				.expect(400);
		});
		it("should fail, as it already exists", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Path',
					name: 'Library'
				})
				.expect(409);
		});
	});

	describe('Get a Library (GET /libraries/:id)', () => {
		it("should get the library", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(dummyRepository.library1)
				});
		});

		it("should get the library (w/ slug)", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library2.slug}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(dummyRepository.library2)
				});
		});

		it("should throw, as the library does not exist", async () => {
			return request(app.getHttpServer())
				.get('/libraries/-1')
				.expect(404);
		});
	});

	describe('Get all Libraries (GET /libraries)', () => {
		it("should get all the libraries", async () => {
			return request(app.getHttpServer())
				.get('/libraries')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(3);
					expect(libraries).toContainEqual(dummyRepository.library1);
					expect(libraries).toContainEqual(dummyRepository.library2);
					expect(libraries).toContainEqual(newLibrary);
				});
		});

		it("should get all the libraries, sorted by name", async () => {
			return request(app.getHttpServer())
				.get('/libraries?sortBy=name&order=desc')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(3);
					expect(libraries[0]).toStrictEqual(newLibrary);
					expect(libraries[1]).toStrictEqual(dummyRepository.library2);
					expect(libraries[2]).toStrictEqual(dummyRepository.library1);
				});
		});

		it("should skip the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?skip=1&take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(1);
					expect(libraries).toContainEqual(dummyRepository.library2);
				});
		});

		it("should take only the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(1);
					expect(libraries).toContainEqual(dummyRepository.library1);
				});
		});

		it("should take none", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1&skip=3')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(0);
				});
		});
	});

	describe('Get all Related album Artists (GET /libraries/:id/artists)', () => {
		it("should return every artists (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistA)
					);
				});
		});

		it("should return every artists (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library2.id}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(
						expectedArtistResponse(dummyRepository.artistB)
					);
				});
		});

		it("should return every artists (from library's slug)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.slug}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(expectedArtistResponse(dummyRepository.artistA));
				});
		});

		it("should return an error, as the library does not exist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/-1/artists`)
				.expect(404);
		});
		
	});

	describe('Get all Related Albums (GET /libraries/:id/albums)', () => {
		it("should return every albums w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/albums?with=artist`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
					expect(albums[1]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.compilationAlbumA),
						artist: null
					});
				});
		});

		it("should return every albums (from library's slug))", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.slug}/albums`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
					expect(albums[1]).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
				});
		});
		it("should return an error, as the library does not exist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/-1/albums`)
				.expect(404);
		});
	});

	describe('Get all Related Videos (GET /libraries/:id/videos)', () => {
		it("should return the songs With video", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/videos`)
				.expect(200)
				.expect((res) => {
					const videoSongs: SongWithVideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(1);
					expect(videoSongs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						video: expectedTrackResponse(dummyRepository.trackA1_2Video)
					});
				});
		});
		it("should return the songs With video (empty page)", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/videos?skip=1`)
				.expect(200)
				.expect((res) => {
					const videoSongs: SongWithVideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(0);
				});
		});
		it("should return an empty list (no videos in library)", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library2.id}/videos`)
				.expect(200)
				.expect((res) => {
					const videoSongs: SongWithVideoResponse[] = res.body.items;
					expect(videoSongs.length).toBe(0);
				});
		});
	});

	describe('Get all Related Releases (GET /libraries/:id/releases)', () => {
		it("should return every releases, w/ tracks & parent album", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/releases?with=album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
				});
		});
		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/releases?sortBy=name&order=desc&with=album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
				});
		});
		it("should return an error, as the library does not exist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/-1/releases`)
				.expect(404);
		});
	});

	describe('Get all Related Tracks (GET /libraries/:id/tracks)', () => {
		it("should return every tracks, w/ song & parent release", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/tracks?with=song,release`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(4);
					expect(tracks).toContainEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						release: expectedReleaseResponse(dummyRepository.releaseA1_1),
						song: expectedSongResponse(dummyRepository.songA1)
					});
					expect(tracks).toContainEqual({
						...expectedTrackResponse(dummyRepository.trackA1_2Video),
						release: expectedReleaseResponse(dummyRepository.releaseA1_2),
						song: expectedSongResponse(dummyRepository.songA1)
					});
					expect(tracks).toContainEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						release: expectedReleaseResponse(dummyRepository.releaseA1_2),
						song: expectedSongResponse(dummyRepository.songA2)
					});
					expect(tracks).toContainEqual({
						...expectedTrackResponse(dummyRepository.trackC1_1),
						release: expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						song: expectedSongResponse(dummyRepository.songC1)
					});
				});
		});
		it("should return an error, as the library does not exist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/-1/tracks`)
				.expect(404);
		});
	});

	describe('Get all Related Songs (GET /libraries/:id/songs)', () => {
		it("should return every songs, w/ parent artist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/songs?with=artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songC1),
						artist: expectedArtistResponse(dummyRepository.artistC),
					});
				});
		});
		it("should return an error, as the library does not exist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/-1/songs`)
				.expect(404);
		});
	});

	describe("Get all Related Songs (PUT /libraries/:id)", () => {
		it("should update the path", async () => {
			return request(app.getHttpServer())
				.put(`/libraries/${dummyRepository.library1.slug}`)
				.send({
					path: '/hello-world',
				})
				.expect(200)
				.expect((res) => {
					const updatedLibrary: Library = res.body;
					expect(updatedLibrary).toStrictEqual({
						...dummyRepository.library1,
						path: '/hello-world'
					});
				});
		});
		it("should update the name, and the slug", async () => {
			return request(app.getHttpServer())
				.put(`/libraries/${dummyRepository.library2.slug}`)
				.send({
					name: 'Hello World Library',
				})
				.expect(200)
				.expect((res) => {
					const updatedLibrary: Library = res.body;
					expect(updatedLibrary).toStrictEqual({
						...dummyRepository.library2,
						name: 'Hello World Library',
						slug: 'hello-world-library'
					});
				});
		});
	})
});