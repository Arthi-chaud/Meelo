import { TestingModule } from "@nestjs/testing";
import { Song, Artist, SongVersion } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import { LyricsService } from "src/lyrics/lyrics.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ScannerModule from "src/scanner/scanner.module";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import SongVersionModule from "./song-version.module";
import SongVersionService from "./song-version.service";
import Slug from "src/slug/slug";

describe("Song Service", () => {
	let songVersionService: SongVersionService;
	let songService: SongService;
	let dummyRepository: TestPrismaService;
	let artistService: ArtistService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				ArtistModule,
				TrackModule,
				AlbumModule,
				IllustrationModule,
				SongVersionModule,
				GenreModule,
				LyricsModule,
				ReleaseModule,
				ScannerModule,
			],
			providers: [SongService, ArtistService, PrismaService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		songService = module.get(SongService);
		songVersionService = module.get(SongVersionService);
		artistService = module.get(ArtistService);

		await dummyRepository.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});
	describe("Song with featuring", () => {
		let mainArtist: Artist;
		let featuredArtist: Artist;
		let baseSong: Song;
		let songVersionWithFeaturing: SongVersion;
		it("should create a song without featuring", async () => {
			mainArtist = await artistService.create({ name: "Katy Perry" });
			baseSong = await songService.create({
				name: "E.T.",
				artist: { id: mainArtist.id },
				genres: [],
			});
		});
		it("should create a song with featuring", async () => {
			featuredArtist = await artistService.create({ name: "Kanye West" });
			songVersionWithFeaturing = await songVersionService.getOrCreate({
				name: "E.T.",
				song: { id: baseSong.id },
				featuring: [{ slug: new Slug(featuredArtist.slug) }],
				type: "Original",
			});
			expect(songVersionWithFeaturing.songId).toBe(baseSong.id);
			expect(songVersionWithFeaturing.slug).toBe("et-feat-kanye-west");
		});

		it("should get the featuring song", async () => {
			let res = await songVersionService.getOrCreate({
				name: "E.T.",
				song: { id: baseSong.id },
				type: "Original",
				featuring: [{ slug: new Slug(featuredArtist.slug) }],
			});
			expect(res).toStrictEqual(songVersionWithFeaturing);
		});

		it("should get the featuring song, with featured artists", async () => {
			let res = await songVersionService.get(
				{ id: songVersionWithFeaturing.id },
				{ featuring: true },
			);
			expect(res.featuring).toStrictEqual([featuredArtist]);
		});
	});
});
