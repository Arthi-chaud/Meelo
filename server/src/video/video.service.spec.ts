import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import SongService from "src/song/song.service";
import ArtistService from "src/artist/artist.service";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import TrackModule from "src/track/track.module";
import AlbumModule from "src/album/album.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";
import VideoService from "./video.service";
import VideoModule from "./video.module";
import ReleaseModule from "src/release/release.module";

describe('Video Service', () => {
	let videoService: VideoService;
	let dummyRepository: TestPrismaService;
	
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, IllustrationModule, GenreModule, LyricsModule, VideoModule, ReleaseModule],
			providers: [SongService, ArtistService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		videoService = module.get(VideoService);
		
		await dummyRepository.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	it('should be defined', () => {
		expect(videoService).toBeDefined();
		expect(dummyRepository).toBeDefined();
	});

	describe("Get Songs With Videos", () => {
		it("should return the songs With video", async () => {
			const videoSongs = await videoService.getVideos({});
			expect(videoSongs.length).toBe(1);
			expect(videoSongs[0]).toStrictEqual({
				...dummyRepository.songA1,
				track: dummyRepository.trackA1_2Video
			});
		});
		it("should return an empty list (pagination)", async () => {
			const videoSongs = await videoService.getVideos({}, { skip: 1 });
			expect(videoSongs.length).toBe(0);
		});
		it("should return songs with their artist", async () => {
			const videoSongs = await videoService.getVideos({}, {}, { artist: true });
			expect(videoSongs.length).toBe(1);
			expect(videoSongs[0]).toStrictEqual({
				...dummyRepository.songA1,
				artist: dummyRepository.artistA,
				track: dummyRepository.trackA1_2Video
			});
		});
	});

});