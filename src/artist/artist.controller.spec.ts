import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, Release, Song, Track } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SongModule from "src/song/song.module";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
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
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";

describe('Artist Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let albumA2: Album;

	const expectedArtistResponse = (artist: Artist) => ({
		...artist,
		illustration: null
	});

	const expectedAlbumResponse = (album: Album) => ({
		...album,
		releaseDate: album.releaseDate?.toISOString() ?? null,
		illustration: null
	});

	const expectedSongResponse = (song: Song) => ({
		...song,
		illustration: null
	});

	const expectedReleaseResponse = (release: Release) => ({
		...release,
		releaseDate: release.releaseDate?.toISOString() ?? null,
		illustration: null
	});

	const expectedTrackResponse = (track: Track) => ({
		...track,
		illustration: null,
		stream: `/files/${track.sourceFileId}/stream`
	});


	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [ReleaseModule, PrismaModule, ArtistModule, SongModule, AlbumModule, TrackModule, MetadataModule, IllustrationModule, GenreModule, LyricsModule],
			providers: [ArtistService, SongService, AlbumService, ReleaseService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		const albumService = module.get(AlbumService);
		albumA2 = await albumService.create({
			name: "My Album 2", artist: { id: dummyRepository.artistA.id }
		});

	});
	
	describe('Get Artists (GET /artists)', () => {
		it("should get all the artists", () => {
			return request(app.getHttpServer())
				.get(`/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistA));
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistB));
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistC));
				});
		});

		it("should get all the artists, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get(`/artists?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists[0]).toStrictEqual(expectedArtistResponse(dummyRepository.artistC));
					expect(artists[1]).toStrictEqual(expectedArtistResponse(dummyRepository.artistB));
					expect(artists[2]).toStrictEqual(expectedArtistResponse(dummyRepository.artistA));
				});
		});
		it("should get only the album artists", () => {
			return request(app.getHttpServer())
				.get(`/artists?albumArtistOnly=true`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistA));
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistB));
				});
		});
		it("should get some artists (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/artists?skip=1&take=1`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(expectedArtistResponse(dummyRepository.artistB));
			});
		});
		it("should get all artists, w/ albums", () => {
			return request(app.getHttpServer())
				.get(`/artists?with=albums`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(3);
					expect(artists[0]).toStrictEqual({
						...expectedArtistResponse(dummyRepository.artistA),
						albums: [
							expectedAlbumResponse(dummyRepository.albumA1),
							expectedAlbumResponse(albumA2)
						]
					});
					expect(artists[1]).toStrictEqual({
						...expectedArtistResponse(dummyRepository.artistB),
						albums: [
							expectedAlbumResponse(dummyRepository.albumB1)
						]
					});
					expect(artists[2]).toStrictEqual({
						...expectedArtistResponse(dummyRepository.artistC),
						albums: []
					});
			});
		});
	});

	describe('Get Artist (GET /artists/:id)', () => {
		it("should get the artist (by id)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					const artist: Artist = res.body;
					expect(artist).toStrictEqual(expectedArtistResponse(dummyRepository.artistA));
			});
		});

		it("should get the artist (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistB.slug}`)
				.expect(200)
				.expect((res) => {
					const artist: Artist = res.body;
					expect(artist).toStrictEqual(expectedArtistResponse(dummyRepository.artistB));
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
				.get(`/artists/${dummyRepository.artistA.id}/songs`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should get all the artist's songs, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/songs?sortBy=name`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
				});
		});	
		it("should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/songs?skip=1`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should get all songs, w/ tracks", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/songs?with=tracks`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA1_1),
							expectedTrackResponse(dummyRepository.trackA1_2Video),
						]
					});
					expect(songs[1]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA2_1)
						]
					});
				});
		});

		it("should return an error, as the artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${-1}/songs`)
				.expect(404);
		});
		
	});

	describe('Get Artist\'s Albums (GET /artists/:id/albums)', () => {
		it("should get all the artist's albums", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/albums`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
					expect(albums[1]).toStrictEqual(expectedAlbumResponse(albumA2));
				});
		});
		it("should get all the artist's albums, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/albums?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(albumA2));
					expect(albums[1]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});
		it("should get some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/albums?take=1`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});
		it("should get all albums, w/ releases", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistB.id}/albums?with=releases`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumB1),
						releases: [
							expectedReleaseResponse(dummyRepository.releaseB1_1)
						]
					});
				});
		});

		it("should return an error, as the artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${-1}/albums`)
				.expect(404);
		});
	});
})