import { INestApplication, ValidationPipe } from "@nestjs/common";
import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import LibraryController from "./library.controller";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";
import IllustrationModule from "src/illustration/illustration.module";
import request from 'supertest';
import type { Album, Artist, Library, Release, Song, Track, File } from "@prisma/client";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import ArtistService from "src/artist/artist.service";
import ReleaseService from "src/release/release.service";
import TrackService from "src/track/track.service";
import AlbumService from "src/album/album.service";
import SongService from "src/song/song.service";
import FileService from "src/file/file.service";
describe('Library Controller', () => {
	let artistService: ArtistService;
	let albumService: AlbumService;
	let songService: SongService;
	let trackService: TrackService;
	let releaseService: ReleaseService;
	let libraryService: LibraryService;
	let fileService: FileService;
	let app: INestApplication;

	let library1: Library;
	let library2: Library;

	let artist1: Artist;

	let album1: Album;
	let album2: Album;

	let release1: Release;
	let release2: Release;

	let song1: Song;
	let song2: Song;
	
	let track1: Track;
	let track2: Track;
	
	let file1: File;
	let file2: File;


	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule],
			providers: [LibraryController, LibraryService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
		songService = module.get<SongService>(SongService);
		trackService = module.get<TrackService>(TrackService);
		releaseService = module.get<ReleaseService>(ReleaseService);
		libraryService = module.get<LibraryService>(LibraryService);
		fileService = module.get<FileService>(FileService);
		app = module.createNestApplication();
		app.useGlobalFilters(
			new NotFoundExceptionFilter(),
			new MeeloExceptionFilter()
		);
		app.useGlobalPipes(new ValidationPipe());
		await app.init();

		library1 = await libraryService.createLibrary({
			name: 'My Library 1',
			path: ""
		});

		library2 = await libraryService.createLibrary({
			name: 'My Library 2',
			path: "a"
		});

		artist1 = await artistService.createArtist({ name: 'My Artist 1' });

		album1 = await albumService.createAlbum({ name: 'My Album 1', artist: { id: artist1.id } });
		album2 = await albumService.createAlbum({ name: 'My Album 2', artist: { id: artist1.id } });

		song1 = await songService.createSong({ name: 'My Song 1', artist: { id: artist1.id } });
		song2 = await songService.createSong({ name: 'My Song 2', artist: { id: artist1.id } });

		release1 = await releaseService.createRelease({ title: 'My Release 1', master: true, album: { byId: { id: album1.id } } });
		release2 = await releaseService.createRelease({ title: 'My Release 2', master: false, album: { byId: { id: album1.id } } });
		
		file1 = await fileService.createFile({
			path: "a",
			md5Checksum: "a",
			registerDate: new Date(),
			libraryId: library1.id
		});

		file2 = await fileService.createFile({
			path: "b",
			md5Checksum: "b",
			registerDate: new Date(),
			libraryId: library1.id
		});

		track1 = await trackService.createTrack({
			type: "Audio",
			master: true,
			displayName: "My Track 1",
			discIndex: 1,
			trackIndex: 1,
			bitrate: 0,
			ripSource: null,
			duration: 0,
			sourceFile: { id: file1.id },
			release: { byId: { id: release1.id } },
			song: { byId: { id: song1.id } },
		});

		track2 = await trackService.createTrack({
			type: "Audio",
			master: true,
			displayName: "My Track 2",
			discIndex: 1,
			trackIndex: 1,
			bitrate: 0,
			ripSource: null,
			duration: 0,
			sourceFile: { id: file2.id },
			release: { byId: { id: release2.id } },
			song: { byId: { id: song2.id } },
		});
	});


	describe('Create Library (POST /libraries/new)', () => {
		it("should create a first library", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Music',
					name: 'My Library 3'
				})
				.expect(201)
				.expect((res) => {
					const library = res.body;
					expect(library.id).toBeDefined();
					expect(library.slug).toBe('my-library-3');
					expect(library.name).toBe('My Library 3');
					expect(library.path).toBe('/Music');
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
					name: 'My Library 1'
				})
				.expect(409);
		});
	});

	describe('Get a Library (GET /libraries/:id)', () => {
		it("should get the library", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.id}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(library1)
				});
		});

		it("should get the library (w/ slug)", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.slug}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(library1)
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
					expect(libraries.at(0)).toStrictEqual(library1);
					expect(libraries.at(1)).toStrictEqual(library2);
					expect(libraries.at(2)?.slug).toBe('my-library-3');
				});
		});

		it("should skip the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?skip=1&take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(1);
					expect(libraries.at(0)).toStrictEqual(library2);
				});
		});

		it("should take only the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(1);
					expect(libraries.at(0)).toStrictEqual(library1);
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

	describe('Get all Related Artists (GET /libraries/:id/artists)', () => {
		it("should return every artists", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.id}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
				});
		});

		it("should return every artists (from librariy's slug)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.slug}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
				});
		});

		it("should return artists (w/ songs)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.id}/artists?with=songs`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`,
						songs: [
							{
								...song1,
								illustration: `http://meelo.com/songs/${song1.id}/illustration`
							},
							{
								...song2,
								illustration: `http://meelo.com/songs/${song2.id}/illustration`
							}
						]
					});
				});
		});

		it("should return artists (w/ albums)", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.id}/artists?with=albums`)
				.expect(200)
				.expect((res) => {
					const artists: (Artist & { albums: Album[]}) [] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0].id).toBe(artist1.id);
					expect(artists[0].albums).toContainEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`
					});
					expect(artists[0].albums).toContainEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`
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
		it("should return every albums w/ releases & artist", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.id}/albums?with=releases,artist`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`,
						releases: [{
							...release1,
							illustration: `http://meelo.com/releases/${release1.id}/illustration`
						}, {
							...release2,
							illustration: `http://meelo.com/releases/${release2.id}/illustration`
						}],
						artist: {
							...artist1,
							illustration: `http://meelo.com/artists/${artist1.id}/illustration`,
						}
					});
				});
		});

		it("should return every albums (from library's slug))", () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.slug}/albums`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`,
					});
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
				.get(`/libraries/${library1.id}/releases?with=tracks,album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual({
						...release1,
						illustration: `http://meelo.com/releases/${release1.id}/illustration`,
						album: {
							...album1,
							illustration: `http://meelo.com/albums/${album1.id}/illustration`,
						},
						tracks: [
							{
								...track1,
								illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
								stream: `http://meelo.com/files/${track1.sourceFileId}/stream`
							},
						]
					});
					expect(releases[1]).toStrictEqual({
						...release2,
						illustration: `http://meelo.com/releases/${release2.id}/illustration`,
						album: {
							...album1,
							illustration: `http://meelo.com/albums/${album1.id}/illustration`,
						},
						tracks: [
							{
								...track2,
								illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
								stream: `http://meelo.com/files/${track2.sourceFileId}/stream`
							},
						]
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
				.get(`/libraries/${library1.id}/tracks?with=song,release`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
						stream: `http://meelo.com/files/${track1.sourceFileId}/stream`,
						release: {
							...release1,
							illustration: `http://meelo.com/releases/${release1.id}/illustration`,
						},
						song: {
							...song1,
							illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						},
					});
					expect(tracks[1]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						stream: `http://meelo.com/files/${track2.sourceFileId}/stream`,
						release: {
							...release2,
							illustration: `http://meelo.com/releases/${release2.id}/illustration`,
						},
						song: {
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						},
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
				.get(`/libraries/${library1.id}/songs?with=tracks,artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						artist: {
							...artist1,
							illustration: `http://meelo.com/artists/${artist1.id}/illustration`,
						},
						tracks: [{
							...track1,
							illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
							stream: `http://meelo.com/files/${track1.sourceFileId}/stream`
						}],
					});
					expect(songs[1]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						artist: {
							...artist1,
							illustration: `http://meelo.com/artists/${artist1.id}/illustration`,
						},
						tracks: [{
							...track2,
							illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
							stream: `http://meelo.com/files/${track2.sourceFileId}/stream`
						}],
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