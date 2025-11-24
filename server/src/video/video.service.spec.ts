import type { TestingModule } from "@nestjs/testing";
import { type Video, VideoType } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import { ArtistNotFoundException } from "src/artist/artist.exceptions";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import Slug from "src/slug/slug";
import { SongNotFoundException } from "src/song/song.exceptions";
import SongModule from "src/song/song.module";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import TrackService from "src/track/track.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	VideoAlreadyExistsException,
	VideoNotFoundException,
} from "./video.exceptions";
import VideoModule from "./video.module";
import VideoService from "./video.service";

describe("Video Service", () => {
	let videoService: VideoService;
	let trackService: TrackService;
	let video1: Video;
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				ArtistModule,
				TrackModule,
				AlbumModule,
				IllustrationModule,
				GenreModule,
				LyricsModule,
				VideoModule,
				SongModule,
				ReleaseModule,
				ParserModule,
			],
			providers: [SongService, ArtistService, PrismaService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		videoService = module.get(VideoService);
		trackService = module.get(TrackService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(videoService).toBeDefined();
		expect(dummyRepository).toBeDefined();
	});

	describe("Get Videos", () => {
		it("should return the video", async () => {
			const videoSongs = await videoService.getMany({}, undefined, {
				master: true,
				illustration: true,
			});
			expect(videoSongs.length).toBe(1);
			expect(videoSongs[0]).toMatchObject({
				...dummyRepository.videoA1,
				illustration: null,
				master: {
					...dummyRepository.trackA1_2Video,
				},
			});
		});
		it("should return an empty list (pagination)", async () => {
			const videoSongs = await videoService.getMany({}, { skip: 1 });
			expect(videoSongs.length).toBe(0);
		});
		it("should return videos with their artist", async () => {
			const videoSongs = await videoService.getMany(
				{},
				{},
				{ artist: true },
			);
			expect(videoSongs.length).toBe(1);
			expect(videoSongs[0]).toStrictEqual({
				...dummyRepository.videoA1,
				artist: dummyRepository.artistA,
			});
		});
	});

	describe("Create Video", () => {
		it("should create the video", async () => {
			const video = await videoService.create({
				name: "My Video",
				type: VideoType.Interview,
				artist: { id: dummyRepository.artistB.id },
			});
			expect(video.name).toBe("My Video");
			expect(video.sortName).toBe("My Video");
			expect(video.sortSlug).toBe("my-video");

			expect(video.slug).toBe(`${dummyRepository.artistB.slug}-my-video`);
			expect(video.type).toBe(VideoType.Interview);
			video1 = video;
		});

		it("should fail, video already exists", () => {
			const test = () =>
				videoService.create({
					name: "My Video",
					artist: { id: dummyRepository.artistB.id },
				});
			expect(test()).rejects.toThrow(VideoAlreadyExistsException);
		});

		it("should fail, song does not exist", () => {
			const test = () =>
				videoService.create({
					name: "test",
					song: { id: -1 },
					artist: { id: dummyRepository.artistA.id },
				});
			expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should fail, artist does not exist", () => {
			const test = () =>
				videoService.create({
					name: "test",
					artist: { id: -1 },
				});
			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});

	describe("Get Video", () => {
		it("should find video", async () => {
			const video = await videoService.get(
				{
					slug: new Slug(dummyRepository.artistB.name, "My Video"),
				},
				{ artist: true },
			);
			expect(video.id).toBe(video1.id);
			expect(video.name).toBe("My Video");
			expect(video.artist).toStrictEqual(dummyRepository.artistB);
		});

		it("should fail to find video by slug", async () => {
			const test = () =>
				videoService.get({
					slug: new Slug("A"),
				});
			expect(test()).rejects.toThrow(VideoNotFoundException);
		});
	});

	describe("Get Or Create Video", () => {
		it("should get video", async () => {
			const video = await videoService.getOrCreate({
				name: "My Video",
				artist: { id: dummyRepository.artistB.id },
			});
			expect(video.id).toBe(video1.id);
		});

		it("should create video", async () => {
			const video = await videoService.getOrCreate({
				name: "My Video 2",
				artist: { id: dummyRepository.artistB.id },
			});
			expect(video.id).not.toBe(video1.id);
			expect(video.slug).toBe(
				`${dummyRepository.artistB.slug}-my-video-2`,
			);
		});
	});

	describe("Update Video", () => {
		it("should set video as extra", async () => {
			const updated = await videoService.update(
				{ type: VideoType.Documentary },
				{ id: dummyRepository.videoA1.id },
			);
			expect(updated.type).toBe(VideoType.Documentary);
			expect(updated.songId).toBe(null);
			expect(updated.groupId).toBe(dummyRepository.songA1.groupId);
			const videoTracks = await trackService.getMany({
				video: { is: { id: dummyRepository.videoA1.id } },
			});
			expect(videoTracks.length).toBeGreaterThanOrEqual(1);
			videoTracks.forEach((track) => expect(track.songId).toBe(null));
		});

		it("should set video back as video", async () => {
			const updated = await videoService.update(
				{ type: VideoType.MusicVideo },
				{ id: dummyRepository.videoA1.id },
			);
			expect(updated.type).toBe(VideoType.MusicVideo);
			expect(updated.songId).toBe(dummyRepository.songA1.id);
			expect(updated.groupId).toBe(dummyRepository.songA1.groupId);

			const videoTracks = await trackService.getMany({
				video: { is: { id: dummyRepository.videoA1.id } },
			});
			expect(videoTracks.length).toBeGreaterThanOrEqual(1);
			videoTracks.forEach((track) =>
				expect(track.songId).toBe(dummyRepository.songA1.id),
			);
		});
	});
});
