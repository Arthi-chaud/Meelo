import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Track } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import SongModule from "src/song/song.module";
import MetadataModule from "src/metadata/metadata.module";
import ReleaseModule from "src/release/release.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import type ReassignTrackDTO from "./models/reassign-track.dto";
import { LyricsModule } from "src/lyrics/lyrics.module";
import LibraryModule from "src/library/library.module";
import SetupApp from "test/setup-app";
import { expectedTrackResponse, expectedSongResponse, expectedReleaseResponse } from "test/expected-responses";

describe('Track Controller', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, TrackModule, IllustrationModule, SongModule, MetadataModule, GenreModule, LyricsModule, LibraryModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();

	});

	afterAll(() => {
		module.close();
		app.close();
	});

	describe("Get Tracks (GET /tracks)", () => {
		it("should return all the tracks", () => {
			return request(app.getHttpServer())
				.get(`/tracks`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(5);
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA1_1));
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackA2_1));
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackB1_1));
					expect(tracks).toContainEqual(expectedTrackResponse(dummyRepository.trackC1_1));
				});
		});
		it("should return all the tracks, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/tracks?sortBy=name`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(5);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackC1_1));
					expect(tracks[1]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA2_1));
					expect(tracks[2]).toStrictEqual(expectedTrackResponse(dummyRepository.trackB1_1));
					expect(tracks[3]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_1));
					expect(tracks[4]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});
		it("should return some tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/tracks?skip=1&take=2&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA2_1));
					expect(tracks[1]).toStrictEqual(expectedTrackResponse(dummyRepository.trackB1_1));
				});
		});
		it("should return tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/tracks?take=1&skip=1&with=song&sortBy=name`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						song: expectedSongResponse(dummyRepository.songA2),
					});
				});
		});
	});

	describe("Get Videos Tracks (GET /tracks/videos)", () => {
		it("should return all the tracks", () => {
			return request(app.getHttpServer())
				.get(`/tracks/videos`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});

		it("should return some the tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/tracks/videos?skip=1`)
				.expect(200)
				.expect((res) => {
					const tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(0);
				});
		});
	});

	describe("Get Track (GET /tracks/:id)", () => {
		it("should return the track", () => {
			return request(app.getHttpServer())
				.get(`/tracks/${dummyRepository.trackA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_1));
				});
		});
		it("should return track w/ related release & song", () => {
			return request(app.getHttpServer())
				.get(`/tracks/${dummyRepository.trackA2_1.id}?with=song,release`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						song: expectedSongResponse(dummyRepository.songA2),
						release: expectedReleaseResponse(dummyRepository.releaseA1_2)
					})
				});
		});
		it("should return an error, as the track does not exist", () => {
			return request(app.getHttpServer())
				.get(`/tracks/-1`)
				.expect(404);
		});
	});

	describe("Reassign the track (POST /tracks/reassign)", () => {
		it("should reassign the track", () => {
			return request(app.getHttpServer())
				.post(`/tracks/reassign`)
				.send(<ReassignTrackDTO>{
					trackId: dummyRepository.trackC1_1.id,
					songId: dummyRepository.songB1.id
				})
				.expect(201)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackC1_1),
						songId: dummyRepository.songB1.id
					});
				});
		});
	});

	describe("Set Track as master (POST /tracks/:id/master)", () => {
		it("should set track as master", () => {
			return request(app.getHttpServer())
				.put(`/tracks/${dummyRepository.trackA1_2Video.id}/master`)
				.expect(200)
				.expect((res) => {
					const track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA1_2Video),
					});
				});
		});
	});
});