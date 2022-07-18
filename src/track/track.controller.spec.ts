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
import request from "supertest";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import SongModule from "src/song/song.module";
import MetadataModule from "src/metadata/metadata.module";
import TrackService from "src/track/track.service";
import FileService from "src/file/file.service";
import LibraryService from "src/library/library.service";
import LibraryModule from "src/library/library.module";
import SongService from "src/song/song.service";
import ReleaseService from "src/release/release.service";
import ReleaseModule from "src/release/release.module";

describe('Song Controller', () => {
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	let album: Album;
	let deluxeRelease: Release;
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
		albumService = module.get<AlbumService>(AlbumService);
		let trackService = module.get<TrackService>(TrackService);
		let fileService = module.get<FileService>(FileService);
		let libraryService = module.get<LibraryService>(LibraryService);
		let songService = module.get<SongService>(SongService);
		artist = await module.get<ArtistService>(ArtistService).createArtist({ name: 'My Artist' });
		album = await albumService.createAlbum(
			{ name: 'My Album', artist: { id: artist.id } }
		);
		deluxeRelease = await releaseService.createRelease({
			title: "My Album (Deluxe Edition)",
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
			discIndex: 1,
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

	describe("Get Tracks (GET /tracks)", () => {
		it("should return all the tracks", () => {
			return request(app.getHttpServer())
				.get(`/tracks`)
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
		it("should return all the tracks, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/tracks?sortBy=displayName`)
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
		it("should return some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?skip=1`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
					});
				});
		});
		it("should return tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/tracks?take=1&with=song`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						song: {
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						},
					});
				});
		});
	});

	describe("Get Track (GET /tracks/:id)", () => {
		it("should return the track", () => {
			return request(app.getHttpServer())
				.get(`/tracks/${track2.id}`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body;
					expect(track).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
					});
				});
		});
		it("should return track w/ related release & song", () => {
			return request(app.getHttpServer())
				.get(`/tracks/${track1.id}?with=song,release`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body;
					expect(track).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
						song: {
							...song1,
							illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						},
						release: {
							...deluxeRelease,
							illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`,
						}
					})
				});
		});
		it("should return an error, as the track does not exist", () => {
			return request(app.getHttpServer())
				.get(`/tracks/-1`)
				.expect(404);
		});
	});
});