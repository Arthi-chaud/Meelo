import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, File, Release, Song, Track } from "@prisma/client";
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
import TrackService from "src/track/track.service";
import FileService from "src/file/file.service";
import LibraryService from "src/library/library.service";
import LibraryModule from "src/library/library.module";
import SongService from "src/song/song.service";
import type Tracklist from "src/track/models/tracklist.model";

describe('Release Controller', () => {
	let releaseService: ReleaseService;
	let releaseController: ReleaseController;
	let albumService: AlbumService;
	let album: Album;
	let compilationAlbum: Album;
	let standardRelease: Release;
	let deluxeRelease: Release;
	let editedRelease: Release;
	let compilationRelease: Release;
	let app: INestApplication;
	let artist: Artist;

	let song1: Song;
	let song2: Song;
	
	let track1: Track;
	let track2: Track;
	
	let file1: File;
	let file2: File;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, LibraryModule, TrackModule, IllustrationModule, SongModule, MetadataModule],
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
		let trackService = module.get<TrackService>(TrackService);
		let fileService = module.get<FileService>(FileService);
		let libraryService = module.get<LibraryService>(LibraryService);
		let songService = module.get<SongService>(SongService);
		artist = await module.get<ArtistService>(ArtistService).createArtist({ name: 'My Artist' });
		album = await albumService.createAlbum(
			{ name: 'My Album', artist: { id: artist.id } }
		);
		compilationAlbum = await albumService.createAlbum(
			{ name: 'My Compilation' }
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

		let library1 = await libraryService.createLibrary({
			name: "My Library",
			path: "a"
		});

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

		song1 = await songService.createSong({
			name: "My Song 1",
			artist: { id: artist.id }
		});

		song2 = await songService.createSong({
			name: "My Song 2",
			artist: { id: artist.id }
		});
		
		track2 = await trackService.createTrack({
			type: "Audio",
			master: true,
			displayName: "My Track 2",
			discIndex: 2,
			trackIndex: 1,
			bitrate: 0,
			ripSource: null,
			duration: 0,
			sourceFile: { id: file2.id },
			release: { byId: { id: deluxeRelease.id } },
			song: { byId: { id: song2.id } },
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
			release: { byId: { id: deluxeRelease.id } },
			song: { byId: { id: song1.id } },
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
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual({
						...compilationRelease,
						illustration: `http://meelo.com/releases/${compilationRelease.id}/illustration`
					});
					expect(releases[1]).toStrictEqual({
						...standardRelease,
						illustration: `http://meelo.com/releases/${standardRelease.id}/illustration`
					});
					expect(releases[2]).toStrictEqual({
						...deluxeRelease,
						illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`
					});
					expect(releases[3]).toStrictEqual({
						...editedRelease,
						illustration: `http://meelo.com/releases/${editedRelease.id}/illustration`
					});
				});
		});

		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get('/releases?sortBy=title')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual({
						...standardRelease,
						illustration: `http://meelo.com/releases/${standardRelease.id}/illustration`
					});
					expect(releases[1]).toStrictEqual({
						...deluxeRelease,
						illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`
					});
					expect(releases[2]).toStrictEqual({
						...editedRelease,
						illustration: `http://meelo.com/releases/${editedRelease.id}/illustration`
					});
					expect(releases[3]).toStrictEqual({
						...compilationRelease,
						illustration: `http://meelo.com/releases/${compilationRelease.id}/illustration`
					});
				});
		});

		it("should return some releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get('/releases?take=1&skip=2')
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual({
						...deluxeRelease,
						illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`
					});
				});
		});

		it("should return releases w/ related albums", () => {
			return request(app.getHttpServer())
				.get('/releases?with=album')
				.expect(200)
				.expect((res) => {
					let releases: (Release & { album: Album })[] = res.body.items;
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

	describe("Get Release (GET /release/:id)", () => {
		it("should return the release", () => {
			return request(app.getHttpServer())
				.get(`/releases/${compilationRelease.id}`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual({
						...compilationRelease,
						illustration: `http://meelo.com/releases/${compilationRelease.id}/illustration`
					});
				});
		});

		it("should return the compilation release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/compilations+${compilationAlbum.slug}+${compilationRelease.slug}`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual({
						...compilationRelease,
						illustration: `http://meelo.com/releases/${compilationRelease.id}/illustration`
					});
				});
		});

		it("should return the release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/${artist.slug}+${album.slug}+${deluxeRelease.slug}`)
				.expect(200)
				.expect((res) => {
					let release: Release = res.body
					expect(release).toStrictEqual({
						...deluxeRelease,
						illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`
					});
				});
		});

		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/-1`)
				.expect(404);
		});

		it("should return an error, as the string is badly formed", () => {
			return request(app.getHttpServer())
				.get(`/releases/${artist.slug}`)
				.expect(400);
		});

		it("should return the release, w/ tracks and parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}?with=tracks,album`)
				.expect(200)
				.expect((res) => {
					let release: Release & { album: Album, tracks: Track[] } = res.body
					expect(release.id).toBe(deluxeRelease.id);
					expect(release.tracks).toStrictEqual([{
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`
					}, {
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`
					}]);
					expect(release.album).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${album.id}/illustration`,
					});
				});
		});
	});

	describe("Get Related Tracks", () => {
		it("should get all the tracks", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/tracks`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
					});
					expect(tracks[1]).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
					});
				});
		});
		it("should get all the tracks, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/tracks?sortBy=displayName`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
					});
					expect(tracks[1]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
					});
				});
		});
		it("should get some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/tracks?skip=1`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
					});
				});
		});
		it("should get tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/tracks?take=1&with=song`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						song: {
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`
						}
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
				.get(`/releases/${deluxeRelease.id}/tracklist`)
				.expect(200)
				.expect((res) => {
					let tracklist: Tracklist = res.body;
					expect(tracklist).toStrictEqual({
						'1': [{
							...track1,
							illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
						}],
						'2': [{
							...track2,
							illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						}],
					});
				});
		});

		it("should get the tracklist, w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/tracklist`)
				.expect(200)
				.expect((res) => {
					let tracklist: Tracklist = res.body;
					expect(tracklist).toStrictEqual({
						'1': [{
							...track1,
							illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
						}],
						'2': [{
							...track2,
							illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
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
		it("should get the  album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/album`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${fetchedAlbum.id}/illustration`
					});
				});
		});
		it("should get album w/ related releases", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/album?with=releases`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${fetchedAlbum.id}/illustration`,
						releases: [{
								...standardRelease,
								illustration: `http://meelo.com/releases/${standardRelease.id}/illustration`
							}, {
								...deluxeRelease,
								illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`
							}, {
								...editedRelease,
								illustration: `http://meelo.com/releases/${editedRelease.id}/illustration`
						}]
					});
				});
		});
		it("should get album w/ parent artist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${deluxeRelease.id}/album?with=artist`)
				.expect(200)
				.expect((res) => {
					let fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${fetchedAlbum.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration`
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