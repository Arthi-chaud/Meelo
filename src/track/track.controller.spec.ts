import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Track } from "@prisma/client";
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
import type ReassignTrackDTO from "./models/reassign-track.dto";
import { LyricsModule } from "src/lyrics/lyrics.module";

describe('Track Controller', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;

	const expectedTrackResponse = (track: Track) => ({
		...track,
		illustration: `http://meelo.com/tracks/${track.id}/illustration`,
		stream: `http://meelo.com/files/${track.sourceFileId}/stream`
	});
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, LibraryModule, TrackModule, IllustrationModule, SongModule, MetadataModule, GenreModule, LyricsModule],
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

	describe("Get Tracks (GET /tracks)", () => {
		it("should return all the tracks", () => {
			return request(app.getHttpServer())
				.get(`/tracks`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
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
				.get(`/tracks?sortBy=displayName`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
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
				.get(`/tracks?skip=1&take=2&sortBy=displayName`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(2);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA2_1));
					expect(tracks[1]).toStrictEqual(expectedTrackResponse(dummyRepository.trackB1_1));
				});
		});
		it("should return tracks w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/tracks?take=1&skip=1&with=song&sortBy=displayName`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						song: {
							...dummyRepository.songA2,
							illustration: `http://meelo.com/songs/${dummyRepository.songA2.id}/illustration`,
						},
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
					let tracks: Track[] = res.body.items;
					expect(tracks.length).toBe(1);
					expect(tracks[0]).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_2Video));
				});
		});

		it("should return some the tracks (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/tracks/videos?skip=1`)
				.expect(200)
				.expect((res) => {
					let tracks: Track[] = res.body.items;
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
					let track: Track = res.body;
					expect(track).toStrictEqual(expectedTrackResponse(dummyRepository.trackA1_1));
				});
		});
		it("should return track w/ related release & song", () => {
			return request(app.getHttpServer())
				.get(`/tracks/${dummyRepository.trackA2_1.id}?with=song,release`)
				.expect(200)
				.expect((res) => {
					let track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackA2_1),
						song: {
							...dummyRepository.songA2,
							illustration: `http://meelo.com/songs/${dummyRepository.songA2.id}/illustration`,
						},
						release: {
							...dummyRepository.releaseA1_2,
							illustration: `http://meelo.com/releases/${dummyRepository.releaseA1_2.id}/illustration`,
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
					let track: Track = res.body;
					expect(track).toStrictEqual({
						...expectedTrackResponse(dummyRepository.trackC1_1),
						master: false,
						songId: dummyRepository.songB1.id
					});
				});
		});
	});
});