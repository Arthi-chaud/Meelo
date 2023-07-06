import { createTestingModule } from "test/test-module";
import { TestingModule } from "@nestjs/testing";
import type { Lyrics, Song, Track } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import SongModule from "src/song/song.module";
import TestPrismaService from "test/test-prisma.service";
import SongService from "./song.service";
import SetupApp from "test/setup-app";
import { expectedSongResponse, expectedArtistResponse, expectedTrackResponse, expectedReleaseResponse } from "test/expected-responses";
import ProviderService from "src/providers/provider.service";
import SettingsService from "src/settings/settings.service";

jest.setTimeout(60000);

describe('Song Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let songService: SongService;
	let providerService: ProviderService;
	
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [SongModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		songService = module.get(SongService);
		providerService = module.get(ProviderService);
		module.get(SettingsService).loadFromFile();
		await dummyRepository.onModuleInit();
		await providerService.onModuleInit();
	});

	afterAll(() => {
		app.close();
	})

	describe("Get Songs (GET /songs)", () => {
		it("should return all songs", () => {
			return request(app.getHttpServer())
				.get(`/songs`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items
					expect(songs.length).toBe(4);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs[2]).toStrictEqual(expectedSongResponse(dummyRepository.songB1));
					expect(songs[3]).toStrictEqual(expectedSongResponse(dummyRepository.songC1));
				});
		});
		it("should return all songs, sorted by name, desc", () => {
			return request(app.getHttpServer())
				.get(`/songs?sortBy=name&order=desc`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items
					expect(songs.length).toBe(4);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs[1]).toStrictEqual(expectedSongResponse(dummyRepository.songB1));
					expect(songs[2]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs[3]).toStrictEqual(expectedSongResponse(dummyRepository.songC1));
				});
		});
		it("should return some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs?skip=1&take=2`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs?with=artist&take=2`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items
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
		it("should return songs w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs?take=1&with=artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA)
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
					const song: Song = res.body
					expect(song).toStrictEqual(expectedSongResponse(dummyRepository.songA1));
				});
		});
		it("should return song (w/ slug)", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA2.slug}`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body
					expect(song).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should return song w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}?with=artist`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA)
					});
				});
		});
		it("should return song w/ external ID", async () => {
			const provider = await dummyRepository.provider.findFirstOrThrow();
			await dummyRepository.songExternalId.create({
				data: {
					songId: dummyRepository.songA1.id,
					providerId: provider.id,
					value: '1234'
				}
			})
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}?with=externalIds`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body
					expect(song).toStrictEqual({
						...expectedSongResponse(dummyRepository.songA1),
						externalIds: [{
							provider: {
								name: provider.name,
								homepage: providerService.getProviderById(provider.id).getProviderHomepage(),
								banner: `/illustrations/providers/${provider.name}/banner`,
								icon: `/illustrations/providers/${provider.name}/icon`,
							},
							value: '1234',
							url: providerService.getProviderById(provider.id).getSongURL('1234')
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
				.get(`/songs/${dummyRepository.songB1.id}/master`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body
					expect(track).toStrictEqual(expectedTrackResponse(dummyRepository.trackB1_1));
				});
		});
		it("should return master track w/ song & release", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA1.id}/master?with=song,release`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA1_1),
						song: expectedSongResponse(dummyRepository.songA1),
						release: expectedReleaseResponse(dummyRepository.releaseA1_1)
					});
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/master`)
				.expect(404);
		});
	});

	describe('Get Artist\'s Songs', () => {
		it("should get all the artist's songs", () => {
			return request(app.getHttpServer())
				.get(`/songs?artist=${dummyRepository.artistA.id}`)
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
				.get(`/songs?artist=${dummyRepository.artistA.id}&sortBy=name`)
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
				.get(`/songs?artist=${dummyRepository.artistA.id}&skip=1`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});
		it("should get all songs, w/ artist", () => {
			return request(app.getHttpServer())
				.get(`/songs?artist=${dummyRepository.artistA.id}&with=artist`)
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
		
	});

	describe("Get Genre's songs", () => {
		it("Should get all the songs", () => {
			return request(app.getHttpServer())
				.get(`/songs?genre=${dummyRepository.genreB.id}`)
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
				.get(`/songs?genre=${dummyRepository.genreC.id}`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songC1));
				});
		});

		it("Should get some songs (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/songs?genre=${dummyRepository.genreB.id}&skip=1&take=1`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs[0]).toStrictEqual(expectedSongResponse(dummyRepository.songA2));
				});
		});

		it("Should get all songs, sorted", () => {
			return request(app.getHttpServer())
				.get(`/songs?genre=${dummyRepository.genreB.id}&sortBy=name&order=desc`)
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
				.get(`/songs?genre=${dummyRepository.genreB.id}&sortBy=name&take=1&with=artist`)
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

	describe('Search Songs', () => {
		it("Search songs", () => {
			return request(app.getHttpServer())
				.get(`/songs?query=other`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(1);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
				}) 
		});

		it("Search songs, w/ pagination", () => {
			return request(app.getHttpServer())
				.get(`/songs?query=my&skip=1&take=2`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
				}) 
		})
	});

	describe('Get Songs from library', () => {
		it("should return every songs, w/ parent artist", () => {
			return request(app.getHttpServer())
				.get(`/songs?library=${dummyRepository.library1.id}&with=artist`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA1),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songA2),
						artist: expectedArtistResponse(dummyRepository.artistA),
					});
					expect(songs).toContainEqual({
						...expectedSongResponse(dummyRepository.songC1),
						artist: expectedArtistResponse(dummyRepository.artistC),
					});
				});
		});
	});

	describe("Increment Song's Play count (PUT /songs/:id/played)", () => {
		it("should return an error, as the track does not exist", () => {
			return request(app.getHttpServer())
				.put(`/songs/${-1}/played`)
				.expect(404)
		});

		it("should increment a song's play count (by id)", () => {
			return request(app.getHttpServer())
				.put(`/songs/${dummyRepository.songC1.id}/played`)
				.expect(200)
				.expect(async (res) => {
					const updatedSong: Song = res.body;
					expect(updatedSong).toStrictEqual({
						...expectedSongResponse(dummyRepository.songC1),
						playCount: dummyRepository.songC1.playCount + 1
					});
				});
		});

		it("should increment a song's play count (by slug)", () => {
			return request(app.getHttpServer())
				.put(`/songs/${dummyRepository.artistC.slug}+${dummyRepository.songC1.slug}/played`)
				.expect(200)
				.expect((res) => {
					const updatedSong: Song = res.body;
					expect(updatedSong).toStrictEqual({
						...expectedSongResponse(dummyRepository.songC1),
						playCount: dummyRepository.songC1.playCount + 2
					});
				});
		});
	});

	describe("Get Song's Lyrics (GET /songs/:id/lyrics)", () => {
		it("should return the song's lyrics", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA1.slug}/lyrics`)
				.expect(200)
				.expect((res) => {
					const lyrics: Lyrics = res.body;
					expect(lyrics).toStrictEqual({
						lyrics: dummyRepository.lyricsA1.content
					});
				});
		});

		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/lyrics`)
				.expect(404);
		});

		it("should return an error, as the lyrics do not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songC1.id}/lyrics`)
				.expect(404);
		})
	});

	describe("Update Song's Lyrics (POST /songs/:id/lyrics)", () => {
		it("should create the song's lyrics", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songA2.id}/lyrics`)
				.send({
					lyrics: '123456',
				})
				.expect(async () => {
					const song = await songService.get({ id: dummyRepository.songA2.id }, { lyrics: true });
					expect(song.lyrics!.content).toBe('123456');
				});
		});
		
		it("should update the song's lyrics", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songA1.id}/lyrics`)
				.send({
					lyrics: 'BLABLABLA',
				})
				.expect(async () => {
					const song = await songService.get({ id: dummyRepository.songA1.id }, { lyrics: true });
					expect(song.lyrics!.content).toBe('BLABLABLA');
				});
		});

		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.post(`/songs/${-1}/lyrics`)
				.send({
					lyrics: 'BLABLABLA',
				})
				.expect(404);
		});
		it("should return an error, as the body is empty", () => {
			return request(app.getHttpServer())
				.post(`/songs/${dummyRepository.songB1.id}/lyrics`)
				.expect(400);
		});
	});

	describe("Delete Song's Lyrics (DELETE /songs/:id/lyrics)", () => {
		it("should return the song's lyrics", () => {
			return request(app.getHttpServer())
				.delete(`/songs/${dummyRepository.artistA.slug}+${dummyRepository.songA1.slug}/lyrics`)
				.expect(200)
				.expect(async () => {
					const song = await songService.get({ id: dummyRepository.songA1.id }, { lyrics: true });
					expect(song.lyrics).toBeNull();
				});
		});

		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.delete(`/songs/${-1}/lyrics`)
				.expect(404);
		});

		it("should return an error, as the lyrics do not exist", () => {
			return request(app.getHttpServer())
				.delete(`/songs/${dummyRepository.songC1.id}/lyrics`)
				.expect(404);
		})
	});

	describe("Get Song's Versions (GET /songs/:id/versions)", () => {
		it("should return the song's versions", async () => {
			const version = await songService.create({ name: 'My Other Song (Remix)', artist: { id: dummyRepository.artistA.id }, genres: [] })
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songA2.id}/versions?sortBy=id&order=desc`)
				.expect(200)
				.expect((res) => {
					const fetchedSongs : Song[] = res.body.items
					expect(fetchedSongs).toStrictEqual([
						expectedSongResponse(version),
						expectedSongResponse(dummyRepository.songA2),
					]);
				});
		});
		it("should return an error, as the song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/songs/${-1}/versions`)
				.expect(404);
		});
	});

	describe("Song Illustration", () => {
		it("Should return the Song illustration", async () => {
			const illustration = await dummyRepository.trackIllustration.create({
				data: { trackId: dummyRepository.trackC1_1.id, blurhash: 'A', colors: ['B'] }
			});
			return request(app.getHttpServer())
				.get(`/songs/${dummyRepository.songC1.id}`)
				.expect(200)
				.expect((res) => {
					const song: Song = res.body;
					expect(song).toStrictEqual({
						...song,
						illustration: {
							...illustration,
							url: '/illustrations/tracks/' + dummyRepository.trackC1_1.id
						}
					});
				});

		});
	})
});