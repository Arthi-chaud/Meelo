import { INestApplication, ValidationPipe } from "@nestjs/common";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import LibraryController from "./library.controller";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";
import IllustrationModule from "src/illustration/illustration.module";
import request from 'supertest';
import type { Album, Artist, Library, Release, Song, Track } from "@prisma/client";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
describe('Library Controller', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let newLibrary: Library;

	const expectedArtistResponse = (artist: Artist) => ({
		...artist,
		illustration: `http://meelo.com/artists/${artist.id}/illustration`
	});

	const expectedAlbumResponse = (album: Album) => ({
		...album,
		releaseDate: album.releaseDate?.toISOString() ?? null,
		illustration: `http://meelo.com/albums/${album.id}/illustration`
	});

	const expectedSongResponse = (song: Song) => ({
		...song,
		illustration: `http://meelo.com/songs/${song.id}/illustration`
	});

	const expectedReleaseResponse = (release: Release) => ({
		...release,
		illustration: `http://meelo.com/releases/${release.id}/illustration`
	});

	const expectedTrackResponse = (track: Track) => ({
		...track,
		illustration: `http://meelo.com/tracks/${track.id}/illustration`,
		stream: `http://meelo.com/files/${track.sourceFileId}/stream`
	});

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule, GenreModule],
			providers: [LibraryController, LibraryService, PrismaService],
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
					expect(artists[0]).toStrictEqual({
						...dummyRepository.artistA,
						illustration: `http://meelo.com/artists/${dummyRepository.artistA.id}/illustration`
					});
				});
		});

		it("should return every artists (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library2.id}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...dummyRepository.artistB,
						illustration: `http://meelo.com/artists/${dummyRepository.artistB.id}/illustration`
					});
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

		it("should return artists (w/ songs)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/artists?with=songs`)
				.expect(200)
				.expect((res) => {
					const artists: (Artist & { songs: Song[] })[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0].songs).toContainEqual(expectedSongResponse(dummyRepository.songA1));
					expect(artists[0].songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
					expect(artists[0].id).toStrictEqual(dummyRepository.artistA.id);
				});
		});

		it("should return artists (w/ albums)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library2.id}/artists?with=albums`)
				.expect(200)
				.expect((res) => {
					const artists: (Artist & { albums: Album[]}) [] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...expectedArtistResponse(dummyRepository.artistB),
						albums: [
							expectedAlbumResponse(dummyRepository.albumB1)
						]
					});
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

	describe('Get all Related Releases (GET /libraries/:id/releases)', () => {
		it("should return every releases, w/ tracks & parent album", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/releases?with=tracks,album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1),
						tracks: [ expectedTrackResponse(dummyRepository.trackA1_1) ]
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA1_2Video),
							expectedTrackResponse(dummyRepository.trackA2_1)
						]
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA),
						tracks: [
							expectedTrackResponse(dummyRepository.trackC1_1)
						]
					});
				});
		});
		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/releases?sortBy=title&order=desc&with=album,tracks`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA),
						tracks: [
							expectedTrackResponse(dummyRepository.trackC1_1)
						]
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA1_2Video),
							expectedTrackResponse(dummyRepository.trackA2_1)
						]
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1),
						tracks: [ expectedTrackResponse(dummyRepository.trackA1_1) ]
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
		it("should return every songs, w/ tracks & parent artist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}/songs?with=tracks,artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA1_1),
							expectedTrackResponse(dummyRepository.trackA1_2Video),
						],
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA2_1)
						],
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songC1),
						artist: expectedArtistResponse(dummyRepository.artistC),
						tracks: [
							expectedTrackResponse(dummyRepository.trackC1_1)
						],
					});
				});
		});
		it("should return an error, as the library does not exist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/-1/songs`)
				.expect(404);
		});
	});

});