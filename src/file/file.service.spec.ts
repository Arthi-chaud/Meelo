import type { TestingModule } from "@nestjs/testing";
import type { File } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { FileAlreadyExistsException, FileNotFoundFromIDException } from "./file.exceptions";
import FileModule from "./file.module";
import FileService from "./file.service";

describe('File Service', () => {
	let fileService: FileService;
	let dummyRepository: TestPrismaService;

	let newFile: File;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileModule, PrismaModule, MetadataModule, FileManagerModule, IllustrationModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule, SettingsModule, GenreModule, LyricsModule],
			providers: [FileService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService)
		await dummyRepository.onModuleInit();
		fileService = module.get<FileService>(FileService);
	});

	it('should be defined', () => {
		expect(fileService).toBeDefined();
	});

	const now = new Date();
	describe('Create File', () => {
		it('should create a file', async () => {
			newFile = await fileService.create({
				path: 'Me',
				libraryId: dummyRepository.library1.id,
				md5Checksum: "Sum",
				registerDate: now
			});
			expect(newFile.id).toBeDefined();
			expect(newFile.libraryId).toBe(dummyRepository.library1.id);
			expect(newFile.md5Checksum).toBe("Sum");
			expect(newFile.path).toBe("Me");
			expect(newFile.registerDate).toStrictEqual(now);
		});

		it('should throw, as the file in the library already exists', async () => {
			const now = new Date();
			const test = async () => await fileService.create({
				path: 'Me',
				libraryId: dummyRepository.library1.id,
				md5Checksum: "Sum",
				registerDate: now
			});
			expect(test()).rejects.toThrow(FileAlreadyExistsException)
		});
	});

	describe('Delete File', () => {
		it('should delete a file (from id)', async () => {
			await fileService.delete({ id: newFile.id });
			const test = async () => fileService.get({ id: newFile.id });
			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});

		it('should throw, as the file does not exist (from id)', () => {
			const test = async () => fileService.delete({ id: -1 });
			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});
	});
});