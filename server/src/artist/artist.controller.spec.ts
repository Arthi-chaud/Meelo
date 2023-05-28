import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Artist, Song } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SongModule from "src/song/song.module";
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
import FileModule from "src/file/file.module";
import { expectedArtistResponse, expectedSongResponse, expectedTrackResponse } from "test/expected-responses";
import { SongWithVideoResponse } from "src/song/models/song-with-video.response";
import ProvidersModule from "src/providers/providers.module";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import ProviderService from "src/providers/provider.service";

describe('Artist Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let providerService: ProviderService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [ReleaseModule, PrismaModule, ArtistModule, SongModule, AlbumModule, TrackModule, MetadataModule, IllustrationModule, GenreModule, LyricsModule, FileModule, ProvidersModule, SettingsModule],
			providers: [ArtistService, SongService, AlbumService, ReleaseService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		providerService = module.get(ProviderService);
		module.get(SettingsService).loadFromFile();
		await providerService.onModuleInit();

	});

	afterAll(() => {
		module.close();
		app.close();
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

		it("should return artist w/ external ID", async () => {
			const provider = await dummyRepository.provider.findFirstOrThrow();
			await dummyRepository.artistExternalId.create({
				data: {
					artistId: dummyRepository.artistA.id,
					providerId: provider.id,
					value: '1234'
				}
			})
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}?with=externalIds`)
				.expect(200)
				.expect((res) => {
					const artist: Artist = res.body
					expect(artist).toStrictEqual({
						...expectedArtistResponse(dummyRepository.artistA),
						externalIds: [{
							provider: {
								name: provider.name,
								homepage: providerService.getProviderById(provider.id).getProviderHomepage(),
								banner: `/illustrations/providers/${provider.name}/banner`,
								icon: `/illustrations/providers/${provider.name}/icon`,
							},
							value: '1234',
							url: providerService.getProviderById(provider.id).getArtistURL('1234')
						}]
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
		it("should get all songs, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/songs?with=artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
					expect(songs[1]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
				});
		});

		it("should return an error, as the artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/artists/${-1}/songs`)
				.expect(404);
		});
		
	});

	describe('Get Artist\'s Videos (GET /artists/:id/videos)', () => {
		it("should get all the artist's videos", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistA.id}/videos`)
				.expect(200)
				.expect((res) => {
					const songs: SongWithVideoResponse[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						video: expectedTrackResponse(dummyRepository.trackA1_2Video)
					});
				});
		});
		it("should get 0 videos", () => {
			return request(app.getHttpServer())
				.get(`/artists/${dummyRepository.artistC.id}/videos`)
				.expect(200)
				.expect((res) => {
					const songs: SongWithVideoResponse[] = res.body.items;
					expect(songs.length).toBe(0);
				});
		});
		it("should return an error, as the artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/artists/-1/videos`)
				.expect(404);
		});
	});
})