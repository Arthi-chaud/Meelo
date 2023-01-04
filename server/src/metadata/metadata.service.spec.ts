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
import { PathParsingException } from "./metadata.exceptions";
import MetadataModule from "./metadata.module";
import MetadataService from "./metadata.service";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import type Metadata from "./models/metadata";

describe('Metadata Service', () => {
	let metadataService: MetadataService

	beforeAll(async () => {
		const moduleRef = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, ArtistModule, AlbumModule, ReleaseModule, MetadataModule, SongModule, TrackModule, IllustrationModule, GenreModule, SettingsModule],
		}).compile();
		metadataService = moduleRef.get<MetadataService>(MetadataService);
	});

	it('should be defined', () => {
		expect(metadataService).toBeDefined();
	});

	describe('Parse Metadata from path', () => {
		it("should throw, as the path does not math any regexes", () => {
			const test = () => {
				metadataService.parseMetadataFromPath('trololol');
			}
			expect(test).toThrow(PathParsingException);
		});

		it("should extract the metadata values from the path", () => {
			const parsedValues: Metadata = metadataService.parseMetadataFromPath(
				'/data/My Album Artist/My Album (2006)/1-02 My Track (My Artist).m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				albumArtist: 'My Album Artist',
				artist: 'My Artist',
				compilation: false,
				album: 'My Album',
				release: undefined,
				releaseDate: new Date('2006'),
				discIndex: 1,
				index: 2,
				genres: undefined,
				name: 'My Track'
			});
		});

		it("should extract the metadata values from the path (compilation)", () => {
			const parsedValues: Metadata = metadataService.parseMetadataFromPath(
				'/data/Compilations/My Album (2006)/1-02 My Track.m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				artist: undefined,
				albumArtist: undefined,
				compilation: true,
				album: 'My Album',
				release: undefined,
				releaseDate: new Date('2006'),
				discIndex: 1,
				index: 2,
				genres: undefined,
				name: 'My Track'
			});
		});
	});

	describe('Parse Metadata from embedded metadata', () => {
		it("should extract the metadata values from the file's tags", async () => {
			const parsedValues: Metadata = await metadataService.parseMetadataFromFile(
				'test/assets/dreams.m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				compilation: false,
				artist: 'My Artist',
				albumArtist: 'My Album Artist',
				album: 'My Album',
				release: 'My Album',
				name: 'Dreams',
				releaseDate: new Date('2007'),
				index: 3,
				discIndex: 2,
				bitrate: 133,
				duration: 210,
				genres: [ "Pop" ],
				type: TrackType.Audio,
			});
		});
	});

	describe('Extract Release name\'s extension', () => {
		it("should build the album name from a basic release name", () => {
			expect(metadataService.removeReleaseExtension('My Album')).toBe('My Album');
			expect(metadataService.removeReleaseExtension("My New Album")).toBe('My New Album');
		});

		it("should build the album name from a release name with a basic extension", () => {
			expect(metadataService.removeReleaseExtension('My Album (Deluxe Edition)')).toBe('My Album');
			expect(metadataService.removeReleaseExtension("My New Album (Edited Special Edition)")).toBe('My New Album');
		});

		it("should build the album name from a release name with a medium extension", () => {
			expect(metadataService.removeReleaseExtension('Garbage (20th Anniversary Deluxe Edition)')).toBe('Garbage');
		});

		it("should build the album name from a release name with a suffix ", () => {
			expect(metadataService.removeReleaseExtension('My Album (Right Now)')).toBe('My Album (Right Now)');
		});

		it("should build the album name from a release name with a prefix ", () => {
			expect(metadataService.removeReleaseExtension('(Right Now) My Album')).toBe('(Right Now) My Album');
		});

		it("should build the album name from a release name with a basic extension and a suffix ", () => {
			expect(metadataService.removeReleaseExtension('My Album (Right Now) [Deluxe Edition]')).toBe('My Album (Right Now)');
		});

		it("should build the album name from a release name with a basic extension and a prefix ", () => {
			expect(metadataService.removeReleaseExtension('(Right Now) My Album [Deluxe Edition]')).toBe('(Right Now) My Album');
		});
		it("should remove the 'Remaster' extension", () => {
			expect(metadataService.removeReleaseExtension('My Album [2022 Remaster]')).toBe('My Album');
		});
		it("should remove the 'remastered' extension", () => {
			expect(metadataService.removeReleaseExtension('My Album [2022 Remastered]')).toBe('My Album');
		});

		it("should remove the 'remastered version' extension", () => {
			expect(metadataService.removeReleaseExtension('My Album [2022 Remastered version]')).toBe('My Album');
		});

		it("should remove the 'remaster' extension, lowercase", () => {
			expect(metadataService.removeReleaseExtension('My Album [2022 Remaster]')).toBe('My Album');
		});

		it("should remove multiple extensions", () => {
			expect(metadataService.removeReleaseExtension('My Album  (Deluxe)  [2022 Remaster] ')).toBe('My Album');
		});
	});

	describe('Extract Track name\'s extension', () => {
		it("should build the song name from a track name with a basic extension", () => {
			expect(metadataService.removeTrackExtension('My Song (Music Video)')).toBe('My Song');
		});

		it("should build the song name from a track name with an even more basic extension", () => {
			expect(metadataService.removeTrackExtension('My Song (Video)')).toBe('My Song');
		});

		it("should build the song name from a track name with a normal extension", () => {
			expect(metadataService.removeTrackExtension('My Song (Official Music Video)')).toBe('My Song');
		})

		it("should remove 'remaster' extension", () => {
			expect(metadataService.removeTrackExtension('My Song  (remastered)')).toBe('My Song');
		});
		it("should remove 'Album Version' extension", () => {
			expect(metadataService.removeTrackExtension('My Song  (Album Version)')).toBe('My Song');
		});

		it("should remove multiple extensions", () => {
			expect(metadataService.removeTrackExtension('My Song  {Music Video}  (Remaster)')).toBe('My Song');
		})
	})
})