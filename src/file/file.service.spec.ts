import type { TestingModule } from "@nestjs/testing";
import type { Library, File } from "@prisma/client";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import IllustrationModule from "src/illustration/illustration.module";
import LibraryModule from "src/library/library.module";
import LibraryService from "src/library/library.service";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { createTestingModule } from "test/TestModule";
import { FileAlreadyExistsException, FileNotFoundFromIDException, FileNotFoundFromPathException } from "./file.exceptions";
import FileModule from "./file.module";
import FileService from "./file.service";

describe('File Service', () => {
	let fileService: FileService;
	let libraryService: LibraryService;
	let library: Library;
	let library2: Library;
	let file1: File;
	let file2: File;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule],
			providers: [FileService, LibraryService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		fileService = module.get<FileService>(FileService);
		libraryService = module.get<LibraryService>(LibraryService);
		library = await libraryService.createLibrary({
			name: 'My Library',
			path: "."
		});
		library2 = await libraryService.createLibrary({
			name: 'My Library2',
			path: "Now"
		});
	});

	it('should be defined', () => {
		expect(fileService).toBeDefined();
		expect(libraryService).toBeDefined();
	});

	describe('Create File', () => {
		it('should create a file', async () => {
			const now = new Date();
			file1 = await fileService.createFile({
				path: 'Me',
				libraryId: library.id,
				md5Checksum: "Sum",
				registerDate: now
			});
			expect(file1.id).toBeDefined();
			expect(file1.libraryId).toBe(library.id);
			expect(file1.md5Checksum).toBe("Sum");
			expect(file1.path).toBe("Me");
			expect(file1.registerDate).toStrictEqual(now);
		});

		it('should throw, as the file in the library already exists', async () => {
			const now = new Date();
			const test = async () => await fileService.createFile({
				path: 'Me',
				libraryId: library.id,
				md5Checksum: "Sum",
				registerDate: now
			});
			expect(test()).rejects.toThrow(FileAlreadyExistsException)
		});

		it('should create a file in another library', async () => {
			const now = new Date();
			file2 = await fileService.createFile({
				path: 'Wow',
				libraryId: library2.id,
				md5Checksum: "Sum",
				registerDate: now
			});
			expect(file2.id).toBeDefined();
			expect(file2.libraryId).toBe(library2.id);
			expect(file2.md5Checksum).toBe("Sum");
			expect(file2.path).toBe("Wow");
			expect(file2.registerDate).toStrictEqual(now);
		})
	});

	describe('Delete File', () => {
		it('should create a file (from path)', async () => {
			await fileService.deleteFile({ path: "Me" });
			const test = async () => fileService.getFile({ path: 'Me' });
			expect(test()).rejects.toThrow(FileNotFoundFromPathException);
		});

		it('should create a file (from id)', async () => {
			await fileService.deleteFile({ id: file2.id });
			const test = async () => fileService.getFile({ id: file2.id });
			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});

		it('should throw, as the file does not exist (from id)', () => {
			const test = async () => fileService.deleteFile({ id: -1 });
			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});

		it('should throw, as the file does not exist (from path)', () => {
			const test = async () => fileService.deleteFile({ path: '' });
			expect(test()).rejects.toThrow(FileNotFoundFromPathException);
		})
	});
});