import { TrackType } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import { PathParsingException } from "./scanner.exceptions";
import ScannerModule from "./scanner.module";
import ScannerService from "./scanner.service";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import type Metadata from "./models/metadata";
import { TestingModule } from "@nestjs/testing";

describe("Metadata Service", () => {
	let scannerService: ScannerService;

	let moduleRef: TestingModule;
	beforeAll(async () => {
		moduleRef = await createTestingModule({
			imports: [
				FileManagerModule,
				PrismaModule,
				ArtistModule,
				AlbumModule,
				ReleaseModule,
				ScannerModule,
				SongModule,
				TrackModule,
				IllustrationModule,
				GenreModule,
				SettingsModule,
			],
		}).compile();
		scannerService = moduleRef.get<ScannerService>(ScannerService);
	});

	afterAll(async () => {
		await moduleRef.close();
	});

	it("should be defined", () => {
		expect(scannerService).toBeDefined();
	});

	describe("Parse Metadata from path", () => {
		it("should throw, as the path does not math any regexes", () => {
			const test = () => {
				scannerService.parseMetadataFromPath("trololol");
			};
			expect(test).toThrow(PathParsingException);
		});

		it("should extract the metadata values from the path", () => {
			const parsedValues: Metadata = scannerService.parseMetadataFromPath(
				"/data/My Album Artist/My Album (2006)/1-02 My Track (My Artist).m4a",
			);

			expect(parsedValues).toMatchObject({
				albumArtist: "My Album Artist",
				artist: "My Artist",
				compilation: false,
				album: "My Album",
				type: "Audio",
				bitrate: undefined,
				duration: undefined,
				release: undefined,
				releaseDate: new Date("2006"),
				discIndex: 1,
				index: 2,
				genres: [],
				name: "My Track",
			});
		});

		it("should extract the metadata values from the path (compilation + video)", () => {
			const parsedValues: Metadata = scannerService.parseMetadataFromPath(
				"/data/Compilations/My Album (2006)/1-02 My Track.m4v",
			);

			expect(parsedValues).toMatchObject({
				artist: undefined,
				albumArtist: undefined,
				compilation: true,
				album: "My Album",
				release: undefined,
				releaseDate: new Date("2006"),
				discIndex: 1,
				index: 2,
				genres: [],
				type: "Video",
				bitrate: undefined,
				duration: undefined,
				name: "My Track",
			});
		});
	});

	describe("Parse Metadata from embedded metadata", () => {
		it("should extract the metadata values from the file's tags", async () => {
			const parsedValues: Metadata =
				await scannerService.parseMetadataFromFile(
					"test/assets/dreams.m4a",
				);

			expect(parsedValues).toMatchObject({
				compilation: false,
				artist: "My Artist",
				albumArtist: "My Album Artist",
				album: "My Album",
				release: "My Album",
				name: "Dreams",
				releaseDate: new Date("2007"),
				index: 3,
				discIndex: 2,
				bitrate: 133,
				duration: 210,
				genres: ["Pop"],
				type: TrackType.Audio,
			});
		});
	});
});
