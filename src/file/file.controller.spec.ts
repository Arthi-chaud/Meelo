import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { File, Library } from "@prisma/client";
import FileManagerService from "src/file-manager/file-manager.service";
import LibraryModule from "src/library/library.module";
import LibraryService from "src/library/library.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import FileModule from "./file.module";
import FileService from "./file.service";
import request from 'supertest';

describe('File Controller', () => {
	let libraryService: LibraryService;
	let fileService: FileService;
	let app: INestApplication;

	let library1: Library;
	let file1: File;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileModule, LibraryModule, PrismaModule]
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		app = await SetupApp(module);
		await module.get<PrismaService>(PrismaService).onModuleInit();
		libraryService = module.get<LibraryService>(LibraryService);
		fileService = module.get<FileService>(FileService);
		library1 = await libraryService.createLibrary({
			path: "&",
			name: "&"
		});
		file1 = await fileService.createFile({
			path: "",
			md5Checksum: "",
			registerDate: new Date(),
			libraryId: library1.id
		});
	});

	describe('Get File', () => {
		it("should find the file", async () => {
			return request(app.getHttpServer())
				.get(`/files/${file1.id}`)
				.expect(200)
				.expect((res) => {
					let file: File = res.body;
					expect(file).toStrictEqual({
						...file1,
						registerDate: file1.registerDate.toISOString()
					});
				});
		});
		it("should return an error, as the file does not exist", async () => {
			return request(app.getHttpServer())
				.get(`/files/${-1}`)
				.expect(404);
		});
	});

	describe('Stream File File', () => {
		it("should return an error, as the source file does not exist", async () => {
			return request(app.getHttpServer())
				.get(`/files/${file1.id}/stream`)
				.expect(404);
		});
	})
});