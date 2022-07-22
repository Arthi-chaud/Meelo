import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Artist, Song, Track } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import request from "supertest";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import SongModule from "src/song/song.module";
import MetadataModule from "src/metadata/metadata.module";
import LibraryModule from "src/library/library.module";
import ReleaseModule from "src/release/release.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";

describe('Song Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	const expectedSongResponse = (song: Song) => ({
		...song,
		illustration: `http://meelo.com/songs/${song.id}/illustration`
	});

	const expectedTrackResponse = (track: Track) => ({
		...track,
		illustration: `http://meelo.com/tracks/${track.id}/illustration`,
		stream: `http://meelo.com/files/${track.sourceFileId}/stream`
	});
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, LibraryModule, TrackModule, IllustrationModule, SongModule, MetadataModule, GenreModule],
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

	describe("Get Songs (GET /songs)", () => {
		it("should return all songs", () => {
			return request(app.getHttpServer())
				.get(`/songs`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(3);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs[2]).toStrictEqual(expectedSongResponse(dummyRepository.songB1));
				});
		});
		it("should return all songs, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get(`/songs?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(3);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songB1));
					expect(songs[2]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should return some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs?skip=1`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should return songs w/ tracks", () => {
			return request(app.getHttpServer())
				.get(`/songs?with=tracks&take=2`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
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
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs?take=1&with=artist`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: {
							...dummyRepository.artistA,
							illustration: `http://meelo.com/artists/${dummyRepository.artistA.id}/illustration`
						}
					});
				});
		});
	});

	describe("Get Song (GET /songs/:id)", () => {
		it("should return song", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
				});
		});
		it("should return song (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA2.slug}`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should return song w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: {
							...dummyRepository.artistA,
							illustration: `http://meelo.com/artists/${dummyRepository.artistA.id}/illustration`
						}
					});
				});
		});
		it("should return song w/ genres", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA2.id}?with=genres`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						genres: [ dummyRepository.genreB ],
					});
				});
		});
		it("should return song w/ tracks", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}?with=tracks`)
				.expect(200)
				.expect((res) => {
					let song: Song = res.body
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						tracks: [
							expectedTrackResponse(dummyRepository.trackA1_1),
							expectedTrackResponse(dummyRepository.trackA1_2Video)
						]
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
				.get(`/songs/${dummyRepository.songB1.id}/master`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body
					expect(track).toStrictEqual(expectedTrackResponse(dummyRepository.trackB1_1));
				});
		});
		it("should return master track w/ song & release", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}/master?with=song,release`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						song: expectedSongResponse(dummyRepository.songA1),
						release: {
							...dummyRepository.releaseA1_1,
							illustration: `http://meelo.com/releases/${dummyRepository.releaseA1_1.id}/illustration`
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
				.get(`/songs/${dummyRepository.songA1.id}/tracks`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_1));
					expect(tracks[1]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});
		it("should return some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}/tracks?take=1`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_1));
				});
		});
		it("should return tracks w/ song", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songB1.id}/tracks?with=song`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackB1_1),
						song: expectedSongResponse(dummyRepository.songB1),
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
				.get(`/songs/${dummyRepository.songA1.id}/videos`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});

		it("should return all video tracks (0 expected)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songB1.id}/videos`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(0);
				});
		});

	});

	describe("Get Song Artist (GET /songs/:id/artist)", () => {
		it("should return artist (by id)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songB1.id}/artist`)
				.expect(200)
				.expect((res) => {
					let fetchedArtist : Artist = res.body
					expect(fetchedArtist).toStrictEqual({
						...dummyRepository.artistB,
						illustration: `http://meelo.com/artists/${dummyRepository.artistB.id}/illustration` 
					});
				});
		});
		it("should return artist (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA2.slug}/artist`)
				.expect(200)
				.expect((res) => {
					let fetchedArtist : Artist = res.body
					expect(fetchedArtist).toStrictEqual({
						...dummyRepository.artistA,
						illustration: `http://meelo.com/artists/${dummyRepository.artistA.id}/illustration` 
					});
				});
		});
		it("should return artist w/ songs & albums", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songB1.id}/artist?with=songs,albums`)
				.expect(200)
				.expect((res) => {
					let fetchedArtist : Artist = res.body
					expect(fetchedArtist).toStrictEqual({
						...dummyRepository.artistB,
						illustration: `http://meelo.com/artists/${dummyRepository.artistB.id}/illustration`,
						albums: [{
							...dummyRepository.albumB1,
							illustration: `http://meelo.com/albums/${dummyRepository.albumB1.id}/illustration`
						}],
						songs: [
							expectedSongResponse(dummyRepository.songB1)
						] 
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