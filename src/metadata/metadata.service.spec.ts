import { Test } from "@nestjs/testing";
import { AlbumModule } from "src/album/album.module";
import { FileManagerModule } from "src/file-manager/file-manager.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { ReleaseModule } from "src/release/release.module";
import { SettingsController } from "src/settings/settings.controller";
import { SettingsModule } from "src/settings/settings.module";
import { SettingsService } from "src/settings/settings.service";
import { SongModule } from "src/song/song.module";
import { TrackModule } from "src/track/track.module";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { PathParsingException } from "./metadata.exceptions";
import { MetadataModule } from "./metadata.module";
import { MetadataService } from "./metadata.service";
import { Metadata } from "./models/metadata";

describe('Metadata Service', () => {
	let metadataService: MetadataService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [MetadataModule, TrackModule, SongModule, AlbumModule, ReleaseModule, SettingsModule, FileManagerModule],
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
				'/data/My Artist/My Album (2006)/1-02 My Track.m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				albumArtist: 'My Artist',
				release: 'My Album',
				releaseDate: new Date('2006'),
				discIndex: 1,
				index: 2,
				name: 'My Track'
			});
		});
	});
})