import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import LibraryModule from "src/library/library.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import type { File } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	FileAlreadyExistsException,
	FileNotFoundException,
} from "./file.exceptions";
import FileModule from "./file.module";
import FileService from "./file.service";

describe("File Service", () => {
	let fileService: FileService;
	let dummyRepository: TestPrismaService;

	let newFile: File;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				FileModule,
				PrismaModule,
				ParserModule,
				FileManagerModule,
				IllustrationModule,
				ArtistModule,
				AlbumModule,
				SongModule,
				ReleaseModule,
				TrackModule,
				SettingsModule,
				GenreModule,
				LyricsModule,
				LibraryModule,
			],
			providers: [FileService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		fileService = module.get<FileService>(FileService);
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(fileService).toBeDefined();
	});

	const now = new Date();
	describe("Create File", () => {
		it("should create a file", async () => {
			newFile = await fileService.create({
				path: "Me",
				libraryId: dummyRepository.library1.id,
				checksum: "Sum",
				registerDate: now,
				fingerprint: null,
			});
			expect(newFile.id).toBeDefined();
			expect(newFile.libraryId).toBe(dummyRepository.library1.id);
			expect(newFile.checksum).toBe("Sum");
			expect(newFile.path).toBe("Me");
			expect(newFile.registerDate).toStrictEqual(now);
		});

		it("should throw, as the file in the library already exists", async () => {
			const now = new Date();
			const test = async () =>
				await fileService.create({
					path: "Me",
					libraryId: dummyRepository.library1.id,
					checksum: "Sum",
					registerDate: now,
					fingerprint: null,
				});
			return expect(test()).rejects.toThrow(FileAlreadyExistsException);
		});
	});

	describe("Delete File", () => {
		it("should delete a file (from id)", async () => {
			await fileService.delete([{ id: newFile.id }]);
			const test = async () => fileService.get({ id: newFile.id });
			return expect(test()).rejects.toThrow(FileNotFoundException);
		});
	});
});
