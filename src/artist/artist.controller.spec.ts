import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, Release, Song } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SongModule from "src/song/song.module";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import SetupApp from "test/SetupApp";
import { createTestingModule } from "test/TestModule";
import ArtistModule from "./artist.module";
import ArtistService from "./artist.service";
import request from 'supertest';
import SongService from "src/song/song.service";
import AlbumService from "src/album/album.service";
import TrackModule from "src/track/track.module";
import ReleaseModule from "src/release/release.module";
import MetadataModule from "src/metadata/metadata.module";
import ReleaseService from "src/release/release.service";
import compilationAlbumArtistKeyword from "src/utils/compilation";
import IllustrationModule from "src/illustration/illustration.module";

describe('Artist Controller', () => {
	let artistService: ArtistService;
	let songService: SongService;
	let albumService: AlbumService;
	let releaseService: ReleaseService;
	let app: INestApplication;

	let artist1: Artist;
	let artist2: Artist;
	let artist3: Artist;

	let song1: Song;
	let song2: Song;

	let album1: Album;
	let album2: Album;
	let release1: Release;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [ReleaseModule, PrismaModule, ArtistModule, SongModule, AlbumModule, TrackModule, MetadataModule, IllustrationModule],
			providers: [ArtistService, SongService, AlbumService, ReleaseService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		app = await SetupApp(module);
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		songService = module.get<SongService>(SongService);
		albumService = module.get<AlbumService>(AlbumService);
		releaseService = module.get<ReleaseService>(ReleaseService);
		artist1 = await artistService.createArtist({ name: 'My Artist 1' });
		artist2 = await artistService.createArtist({ name: 'My Artist 2' });
		artist3 = await artistService.createArtist({ name: 'My Artist 3' });

		song2 = await songService.createSong({ name: 'My Song 2', artist: { id: artist1.id } });
		song1 = await songService.createSong({ name: 'My Song 1', artist: { id: artist1.id } });
		
		album2 = await albumService.createAlbum({ name: 'My Album 2', artist: { id: artist1.id } });
		album1 = await albumService.createAlbum({ name: 'My Album 1', artist: { id: artist1.id } });

		release1 = await releaseService.createRelease({
			title: 'My Album 1 Release',
			master: true,
			album: { byId: { id: album1.id } },
		});
	});
	
	describe('Get Artists (GET /artists)', () => {
		it("should get all the artists", () => {
			return request(app.getHttpServer())
				.get(`/artists`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists[0]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
					expect(artists[1]).toStrictEqual({
						...artist2,
						illustration: `http://meelo.com/artists/${artist2.id}/illustration`
					});
					expect(artists[2]).toStrictEqual({
						...artist3,
						illustration: `http://meelo.com/artists/${artist3.id}/illustration`
					});
				});
		});

		it("should get all the artists, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get(`/artists?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists[0]).toStrictEqual({
						...artist3,
						illustration: `http://meelo.com/artists/${artist3.id}/illustration`
					});
					expect(artists[1]).toStrictEqual({
						...artist2,
						illustration: `http://meelo.com/artists/${artist2.id}/illustration`
					});
					expect(artists[2]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
				});
		});
		it("should get only the album artists", () => {
			return request(app.getHttpServer())
				.get(`/artists?albumArtistOnly=true`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
				});
		});
		it("should get some artists (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/artists?skip=1&take=1`)
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
		it("should get all artists, w/ albums", () => {
			return request(app.getHttpServer())
				.get(`/artists?with=albums`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists[0]).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`,
						albums: [
							{
								...album2,
								illustration: `http://meelo.com/albums/${album2.id}/illustration`,
							},
							{
								...album1,
								illustration: `http://meelo.com/albums/${album1.id}/illustration`,
							},
						]
					});
					expect(artists[1]).toStrictEqual({
						...artist2,
						illustration: `http://meelo.com/artists/${artist2.id}/illustration`,
						albums: []
					});
					expect(artists[2]).toStrictEqual({
						...artist3,
						illustration: `http://meelo.com/artists/${artist3.id}/illustration`,
						albums: []
					});
			});
		});
	});

	describe('Get Artist (GET /artists/:id)', () => {
		it("should get the artist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}`)
				.expect(200)
				.expect((res) => {
					let artist: Artist = res.body;
					expect(artist).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
			});
		});

		it("should get the artist (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.slug}`)
				.expect(200)
				.expect((res) => {
					let artist: Artist = res.body;
					expect(artist).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`
					});
			});
		});
		it("should get the artist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}`)
				.expect(200)
				.expect((res) => {
					let artist: Artist = res.body;
					expect(artist).toStrictEqual({
						...artist1,
						illustration: `http://meelo.com/artists/${artist1.id}/illustration`,
					});
			});
		});
		it("should return an error, as the artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${-1}`)
				.expect(404);
		});

		it("should return an error, as the compilation artist 'does not exist'", () => {
			return request(app.getHttpServer())
				.get(`/artists/${compilationAlbumArtistKeyword}`)
				.expect(400);
		});
	});

	describe('Get Artist\'s Songs (GET /artists/:id/songs)', () => {
		it("should get all the artist's songs", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/songs`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
					});
					expect(songs[1]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
					});
				});
		});
		it("should get all the artist's songs, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/songs?sortBy=name`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
					});
					expect(songs[1]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
					});
				});
		});	
		it("should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/songs?skip=1`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
					});
				});
		});
		it("should get all songs, w/ tracks", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/songs?with=tracks`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...song2,
						illustration: `http://meelo.com/songs/${song2.id}/illustration`,
						tracks: []
					});
					expect(songs[1]).toStrictEqual({
						...song1,
						illustration: `http://meelo.com/songs/${song1.id}/illustration`,
						tracks: []
					});
				});
		});
	});

	describe('Get Artist\'s Albums (GET /artists/:id/albums)', () => {
		it("should get all the artist's albums", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/albums`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`,
					});
					expect(albums[1]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`,
					});
				});
		});
		it("should get all the artist's albums, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/albums?sortBy=name`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`,
					});
					expect(albums[1]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`,
					});
				});
		});
		it("should get some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/albums?take=1`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`,
					});
				});
		});
		it("should get all albums, w/ releases", () => {
			return request(app.getHttpServer())
				.get(`/artists/${artist1.id}/albums?with=releases`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual({
						...album2,
						illustration: `http://meelo.com/albums/${album2.id}/illustration`,
						releases: []
					});
					expect(albums[1]).toStrictEqual({
						...album1,
						illustration: `http://meelo.com/albums/${album1.id}/illustration`,
						releases: [{
							...release1,
							illustration: `http://meelo.com/releases/${release1.id}/illustration`,
						}]
					});
				});
		});
	});
})