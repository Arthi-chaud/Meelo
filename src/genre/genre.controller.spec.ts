import { INestApplication, ValidationPipe } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Artist, Song, Genre, Album, Release } from "@prisma/client";
import request from "supertest";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import FileManagerService from "src/file-manager/file-manager.service";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import GenreModule from "./genre.module";
import GenreService from "./genre.service";
import MetadataModule from "src/metadata/metadata.module";
import AlbumService from "src/album/album.service";
import TrackService from "src/track/track.service";
import ReleaseService from "src/release/release.service";
import FileService from "src/file/file.service";
import LibraryService from "src/library/library.service";
import FileModule from "src/file/file.module";
import SongModule from "src/song/song.module";
import LibraryModule from "src/library/library.module";

describe("Genre Controller", () => {
	let app: INestApplication;
	let artist: Artist;
	let artist2: Artist;
	
	let song: Song;
	let song2: Song;
	let song3: Song;

	let genre: Genre;
	let genre2: Genre;
	let genre3: Genre;

	let album: Album;
	let album2: Album;

	let release: Release;
	let release2: Release;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule, MetadataModule, FileModule, SongModule, LibraryModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		app = module.createNestApplication();
		app.useGlobalFilters(
			new NotFoundExceptionFilter(),
			new MeeloExceptionFilter()
		);
		app.useGlobalPipes(new ValidationPipe());
		await app.init();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		let songService = module.get<SongService>(SongService);
		let artistService = module.get<ArtistService>(ArtistService);
		let genreService = module.get<GenreService>(GenreService);
		let albumService = module.get<AlbumService>(AlbumService);
		let trackService = module.get<TrackService>(TrackService);
		let releaseService = module.get<ReleaseService>(ReleaseService);
		let fileService = module.get<FileService>(FileService);
		let libraryService = module.get<LibraryService>(LibraryService);
		genre3 = await genreService.createGenre({ name: 'My Genre 3' });
		genre = await genreService.createGenre({ name: 'My Genre 1' });
		genre2 = await genreService.createGenre({ name: 'My Genre 2' });
		artist = await artistService.createArtist({ name: 'My Artist' });
		artist2 = await artistService.createArtist({ name: 'My Artist 2' });
		album2 = await albumService.createAlbum({ name: 'My Album 2', artist: { id: artist2.id } });
		album = await albumService.createAlbum({ name: 'My Album 1', artist: { id: artist.id } });
		release = await releaseService.createRelease({
			title: 'My Release 1', album: { byId: { id: album.id } },
			master: true
		});
		release2 = await releaseService.createRelease({
			title: 'My Release 2', album: { byId: { id: album2.id } },
			master: true
		});
		song3 = await songService.createSong({
			name: 'My Song 3',
			artist: { id: artist2.id },
			genres: [{ id: genre3.id }]
		});
		song = await songService.createSong({
			name: 'My Song',
			artist: { id: artist.id },
			genres: [{ id: genre.id }, { id: genre3.id }]
		});
		song2 = await songService.createSong({
			name: 'My Song 2',
			artist: { id: artist2.id },
			genres: [{ id: genre2.id }]
		});

		const library = await libraryService.createLibrary({
			name: "z",
			path: "z"
		});

		const file1 = await fileService.createFile({
			path: "a",
			md5Checksum: "",
			registerDate: new Date(),
			libraryId: library.id
		});

		const file2 = await fileService.createFile({
			path: "b",
			md5Checksum: "",
			registerDate: new Date(),
			libraryId: library.id
		});

		const file3 = await fileService.createFile({
			path: "c",
			md5Checksum: "",
			registerDate: new Date(),
			libraryId: library.id
		});

		await trackService.createTrack({
			type: "Audio",
			displayName: "",
			master: false,
			discIndex: null,
			trackIndex: null,
			bitrate: 0,
			ripSource: null,
			duration: 0,
			sourceFile: { id: file1.id },
			release: { byId: { id: release.id } },
			song: { byId: { id: song.id } },
		});
		await trackService.createTrack({
			type: "Audio",
			displayName: "",
			master: false,
			discIndex: null,
			trackIndex: null,
			bitrate: 0,
			ripSource: null,
			duration: 0,
			sourceFile: { id: file2.id },
			release: { byId: { id: release2.id } },
			song: { byId: { id: song2.id } },
		});
		await trackService.createTrack({
			type: "Audio",
			displayName: "",
			master: false,
			discIndex: null,
			trackIndex: null,
			bitrate: 0,
			ripSource: null,
			duration: 0,
			sourceFile: { id: file3.id },
			release: { byId: { id: release2.id } },
			song: { byId: { id: song3.id } },
		});
	});

	describe("Get Genre", () => {
		it("Should get the genre (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre.slug}`)
				.expect(200)
				.expect((res) => {
					let fetchedGenre: Genre = res.body;
					expect(fetchedGenre).toStrictEqual(genre)
				});
		});

		it("Should get the genre (by id)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}`)
				.expect(200)
				.expect((res) => {
					let fetchedGenre: Genre = res.body;
					expect(fetchedGenre).toStrictEqual(genre3)
				});
		});

		it("Should get the genre w/ songs", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre2.id}?with=songs`)
				.expect(200)
				.expect((res) => {
					let fetchedGenre: Genre & { songs: Song[] } = res.body;
					expect(fetchedGenre).toStrictEqual({
						...genre2,
						songs: [{
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`
						}]
					})
				});
		});

		it("Should return an error, as the genre does not exist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${-1}`)
				.expect(404);
		});
	});

	describe("Get Genres", () => {
		it("Should get all the genres", () => {
			return request(app.getHttpServer())
				.get(`/genres`)
				.expect(200)
				.expect((res) => {
					let genres: Genre[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres).toContainEqual(genre);
					expect(genres).toContainEqual(genre2);
					expect(genres).toContainEqual(genre3);
				});
		});

		it("Should get some genres (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres?take=2&sortBy=name`)
				.expect(200)
				.expect((res) => {
					let genres: Genre[] = res.body.items;
					expect(genres.length).toBe(2);
					expect(genres).toContainEqual(genre);
					expect(genres).toContainEqual(genre2);
				});
		});

		it("Should get all genres, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					let genres: Genre[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres[0]).toStrictEqual(genre3);
					expect(genres[1]).toStrictEqual(genre2);
					expect(genres[2]).toStrictEqual(genre);
				});
		});

		it("Should get all genres, w/ songs", () => {
			return request(app.getHttpServer())
				.get(`/genres?with=songs`)
				.expect(200)
				.expect((res) => {
					let genres: (Genre & { songs: Song[] })[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres).toContainEqual({
						...genre3,
						songs: [
							{
								...song3,
								illustration: `http://meelo.com/songs/${song3.id}/illustration`
							},
							{
								...song,
								illustration: `http://meelo.com/songs/${song.id}/illustration`
							},
						]
					});
					expect(genres).toContainEqual({
						...genre2,
						songs: [{
							...song2,
							illustration: `http://meelo.com/songs/${song2.id}/illustration`
						}]
					});
					expect(genres).toContainEqual({
						...genre,
						songs: [{
							...song,
							illustration: `http://meelo.com/songs/${song.id}/illustration`
						}]
					});
				});
		});
	});

	describe("Get Genre's Artists", () => {
		it("Should get all the artists", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/artists`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration`
					});
					expect(artists).toContainEqual({
						...artist2,
						illustration: `http://meelo.com/artists/${artist2.id}/illustration`
					});
				});
		});

		it("Should get all the artists (one expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre.id}/artists`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration`
					});
				});
		});

		it("Should get some artists (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/artists?skip=1&sortBy=name`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...artist2,
						illustration: `http://meelo.com/artists/${artist2.id}/illustration`
					});
				});
		});

		it("Should get all artists, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/artists?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists[0]).toStrictEqual({
						...artist2,
						illustration: `http://meelo.com/artists/${artist2.id}/illustration`
					});
					expect(artists[1]).toStrictEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration`
					});
				});
		});

		it("Should get artists, w/ songs", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre.id}/artists?sortBy=name&order=desc&with=songs`)
				.expect(200)
				.expect((res) => {
					let artists: (Artist & { songs: Song[] }) [] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...artist,
						illustration: `http://meelo.com/artists/${artist.id}/illustration`,
						songs: [{
							...song,
							illustration: `http://meelo.com/songs/${song.id}/illustration`
						}]
					});
				});
		});
	});

	describe("Get Genre's albums", () => {
		it("Should get all the albums (2 expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/albums`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual({
						...album,
						illustration: `http://meelo.com/albums/${album.id}/illustration`
					});
					expect(artists).toContainEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`
					});
				});
		});

		it("Should get all the albums (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre.id}/albums`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual({
						...album,
						illustration: `http://meelo.com/albums/${album.id}/illustration`
					});
				});
		});

		it("Should get some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/albums?sortBy=name&take=1`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${album.id}/illustration`
					});
				});
		});

		it("Should get all albums, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/albums?sortBy=name`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${album.id}/illustration`
					});
					expect(albums[1]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`
					});
				});
		});

		it("Should get all albums, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/albums?sortBy=name&take=1&with=artist`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...album,
						illustration: `http://meelo.com/albums/${album.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration`,
						}
					});
				});
		});
	});

	describe("Get Genre's songs", () => {
		it("Should get all the songs", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/songs`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual({
						...song,
						illustration: `http://meelo.com/songs/${song.id}/illustration`
					});
					expect(songs).toContainEqual({
						...song3,
						illustration: `http://meelo.com/songs/${song3.id}/illustration`
					});
				});
		});

		it("Should get all the songs (one expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre2.id}/songs`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs).toContainEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`
					});
				});
		});

		it("Should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/songs?sortBy=name&skip=1`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...song3,
						illustration: `http://meelo.com/songs/${song3.id}/illustration`
					});
				});
		});

		it("Should get all songs, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/songs?sortBy=name`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song,
						illustration: `http://meelo.com/songs/${song.id}/illustration`
					});
					expect(songs[1]).toStrictEqual({
						...song3,
						illustration: `http://meelo.com/songs/${song3.id}/illustration`
					});
				});
		});

		it("Should get songs, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${genre3.id}/songs?sortBy=name&take=1&with=artist`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...song,
						illustration: `http://meelo.com/songs/${song.id}/illustration`,
						artist: {
							...artist,
							illustration: `http://meelo.com/artists/${artist.id}/illustration`,
						}
					});
				});
		});
	});
});