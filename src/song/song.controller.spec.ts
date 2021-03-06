import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, File, Genre, Release, Song, Track } from "@prisma/client";
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
import GenreModule from "src/genre/genre.module";
import GenreService from "src/genre/genre.service";

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

	let genre1: Genre;
	let genre2: Genre;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, LibraryModule, TrackModule, IllustrationModule, SongModule, MetadataModule, GenreModule],
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
		let genreService = module.get<GenreService>(GenreService);
		genre1 = await genreService.createGenre({ name: 'My Genre 1' });
		genre2 = await genreService.createGenre({ name: 'My Genre 2' });
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
			artist: { id: artist.id },
			genres: [{ id: genre1.id }]
		});

		song2 = await songService.createSong({
			name: "My Song 2",
			artist: { id: artist.id },
			genres: [{ id: genre1.id }, { id: genre2.id }]
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

		track2 = await trackService.createTrack({
			type: "Video",
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
	});

	describe("Get Songs (GET /songs)", () => {
		it("should return all songs", () => {
			return request(app.getHttpServer())
				.get(`/songs`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`
					});
					expect(songs[1]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`
					});
				});
		});
		it("should return all songs, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get(`/songs?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(2);
					expect(songs[1]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`
					});
					expect(songs[0]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`
					});
				});
		});
		it("should return some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs?skip=1`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
					});
				});
		});
		it("should return songs w/ tracks", () => {
			return request(app.getHttpServer())
				.get(`/songs?with=tracks`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						tracks: [{
							...track1,
							illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
							stream: `http://meelo.com/files/${track1.sourceFileId}/stream`
						}]
					});
					expect(songs[1]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						tracks: [{
							...track2,
							illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
							stream: `http://meelo.com/files/${track2.sourceFileId}/stream`
						}]
					});
				});
		});
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs?skip=1&with=artist`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration` 
						}
					});
				});
		});
	});

	describe("Get Song (GET /songs/:id)", () => {
		it("should return song", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song1.id}`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
					});
				});
		});
		it("should return song (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${artist.slug}+${song1.slug}`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
					});
				});
		});
		it("should return song w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song1.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration` 
						}
					});
				});
		});
		it("should return song w/ genres", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}?with=genres`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...song2,
						genres: [ genre1, genre2 ],
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
					});
				});
		});
		it("should return song w/ tracks", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song1.id}?with=tracks`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						tracks: [{
							...track1,
							illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
							stream: `http://meelo.com/files/${track1.sourceFileId}/stream`
						}]
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}`)
				.expect(404);
		});
	});

	describe("Get Song Master (GET /songs/:id/master)", () => {
		it("should return master tracks", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song1.id}/master`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body
					expect(track).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
						stream: `http://meelo.com/files/${track1.sourceFileId}/stream`
					});
				});
		});
		it("should return master track w/ song & release", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}/master?with=song,release`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body
					expect(track).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						stream: `http://meelo.com/files/${track2.sourceFileId}/stream`,
						song: {
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						},
						release: {
							...deluxeRelease,
							illustration: `http://meelo.com/releases/${deluxeRelease.id}/illustration`
						}
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/master`)
				.expect(404);
		});
	});

	describe("Get Song Tracks (GET /songs/:id/tracks)", () => {
		it("should return tracks", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}/tracks`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						stream: `http://meelo.com/files/${track2.sourceFileId}/stream`
					});
				});
		});
		it("should return some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song1.id}/tracks?take=1`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track1,
						illustration: `http://meelo.com/tracks/${track1.id}/illustration`,
						stream: `http://meelo.com/files/${track1.sourceFileId}/stream`
					});
				});
		});
		it("should return tracks w/ song", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}/tracks?with=song`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						stream: `http://meelo.com/files/${track2.sourceFileId}/stream`,
						song: {
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						}
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/tracks`)
				.expect(404);
		});
	});

	describe("Get Song Video Tracks (GET /songs/:id/videos)", () => {
		it("should return all video tracks (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}/videos`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...track2,
						illustration: `http://meelo.com/tracks/${track2.id}/illustration`,
						stream: `http://meelo.com/files/${track2.sourceFileId}/stream`
					});
				});
		});

		it("should return all video tracks (0 expected)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song1.id}/videos`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(0);
				});
		});

	});

	describe("Get Song Artist (GET /songs/:id/artist)", () => {
		it("should return artist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}/artist`)
				.expect(200)
				.expect((res) => {
					let fetchedArtist : Artist = res.body
					expect(fetchedArtist).toStrictEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration` 
					});
				});
		});
		it("should return artist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${artist.slug}+${song2.slug}/artist`)
				.expect(200)
				.expect((res) => {
					let fetchedArtist : Artist = res.body
					expect(fetchedArtist).toStrictEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration` 
					});
				});
		});
		it("should return artist w/ songs & albums", () => {
			return request(app.getHttpServer())
				.get(`/songs/${song2.id}/artist?with=songs,albums`)
				.expect(200)
				.expect((res) => {
					let fetchedArtist : Artist = res.body
					expect(fetchedArtist).toStrictEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration`,
						albums: [{
							...album,
							illustration: `http://meelo.com/albums/${album.id}/illustration`
						}],
						songs: [{
							...song1,
							illustration: `http://meelo.com/songs/${song1.id}/illustration`
						}, {
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`
						}] 
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/artist`)
				.expect(404);
		});
	});
});