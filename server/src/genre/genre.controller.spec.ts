import { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Artist, Song, Genre, Album } from "src/prisma/models";
import request from "supertest";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import GenreModule from "./genre.module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";
import MetadataModule from "src/metadata/metadata.module";
import SetupApp from "test/setup-app";

describe("Genre Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;

	const expectedSongResponse = (song: Song) => ({
		...song,
		registeredAt: song.registeredAt.toISOString(),
		illustration: null
	});

	const expectedArtistResponse = (artist: Artist) => ({
		...artist,
		registeredAt: artist.registeredAt.toISOString(),
		illustration: null
	});

	const expectedAlbumResponse = (album: Album) => ({
		...album,
		registeredAt: album.registeredAt.toISOString(),
		releaseDate: album.releaseDate?.toISOString() ?? null,
		illustration: null
	});


	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule, LyricsModule, MetadataModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	describe("Get Genre", () => {
		it("Should get the genre (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreA.slug}`)
				.expect(200)
				.expect((res) => {
					const fetchedGenre: Genre = res.body;
					expect(fetchedGenre).toStrictEqual(dummyRepository.genreA)
				});
		});

		it("Should get the genre (by id)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}`)
				.expect(200)
				.expect((res) => {
					const fetchedGenre: Genre = res.body;
					expect(fetchedGenre).toStrictEqual(dummyRepository.genreB)
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
					const genres: Genre[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres).toContainEqual(dummyRepository.genreA);
					expect(genres).toContainEqual(dummyRepository.genreB);
					expect(genres).toContainEqual(dummyRepository.genreC);
				});
		});

		it("Should get some genres (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres?take=2&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres.length).toBe(2);
					expect(genres).toContainEqual(dummyRepository.genreA);
					expect(genres).toContainEqual(dummyRepository.genreB);
				});
		});

		it("Should get all genres, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const genres: Genre[] = res.body.items;
					expect(genres.length).toBe(3);
					expect(genres[0]).toStrictEqual(dummyRepository.genreC);
					expect(genres[1]).toStrictEqual(dummyRepository.genreB);
					expect(genres[2]).toStrictEqual(dummyRepository.genreA);
				});
		});
	});

	describe("Get Genre's Artists", () => {
		it("Should get all the artists", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistA));
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistB));
				});
		});

		it("Should get all the artists (one expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreC.id}/artists`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistC));
				});
		});

		it("Should get some artists (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/artists?skip=1&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists[0]).toStrictEqual(expectedArtistResponse(dummyRepository.artistB));
				});
		});

		it("Should get all artists, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/artists?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists[0]).toStrictEqual(expectedArtistResponse(dummyRepository.artistB));
					expect(artists[1]).toStrictEqual(expectedArtistResponse(dummyRepository.artistA));
				});
		});

		it("Should return an error, as the genre does not exist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${-1}/artists`)
				.expect(404);
		});
	});

	describe("Get Genre's albums", () => {
		it("Should get all the albums (2 expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/albums`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums).toContainEqual(expectedAlbumResponse(dummyRepository.albumA1));
					expect(albums).toContainEqual(expectedAlbumResponse(dummyRepository.albumB1));
				});
		});

		it("Should get all the albums (1 expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreA.id}/albums`)
				.expect(200)
				.expect((res) => {
					const artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});

		it("Should get some albums (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/albums?sortBy=name&take=1`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});

		it("Should get all albums, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/albums?sortBy=name`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums[0]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
					expect(albums[1]).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1));
				});
		});

		it("Should get all albums, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/albums?sortBy=name&take=1&with=artist`)
				.expect(200)
				.expect((res) => {
					const albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums[0]).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumA1),
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
				});
		});
		it("Should return an error, as the genre does not exist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${-1}/albums`)
				.expect(404);
		});
	});

	describe("Get Genre's songs", () => {
		it("Should get all the songs", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/songs`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
				});
		});

		it("Should get all the songs (one expected)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreC.id}/songs`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songC1));
				});
		});

		it("Should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/songs?skip=1&take=1`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});

		it("Should get all songs, sorted", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/songs?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songB1));
					expect(songs[2]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
				});
		});

		it("Should get songs, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/genres/${dummyRepository.genreB.id}/songs?sortBy=name&take=1&with=artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
				});
		});
	});
});