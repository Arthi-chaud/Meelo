import { TrackType } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { createTestingModule } from "test/TestModule";
import { PathParsingException } from "./metadata.exceptions";
import MetadataModule from "./metadata.module";
import MetadataService from "./metadata.service";
import type Metadata from "./models/metadata";

describe('Metadata Service', () => {
	let metadataService: MetadataService

	beforeAll(async () => {
		const moduleRef = await createTestingModule({
			imports: [MetadataModule, TrackModule, SongModule, AlbumModule, ReleaseModule, SettingsModule, FileManagerModule, ArtistModule],
			providers: [MetadataService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
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
			let parsedValues: Metadata = metadataService.parseMetadataFromPath(
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
				name: 'My Track'
			});
		});

		it("should extract the metadata values from the path (compilation)", () => {
			let parsedValues: Metadata = metadataService.parseMetadataFromPath(
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
				name: 'My Track'
			});
		});
	});

	describe('Parse Metadata from embedded metadata', () => {
		it("should extract the metadata values from the file's tags", async () => {
			let parsedValues: Metadata = await metadataService.parseMetadataFromFile(
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
	});
})