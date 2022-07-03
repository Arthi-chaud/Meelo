import type { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import LibraryController from "./library.controller";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";
import IllustrationModule from "src/illustration/illustration.module";
import request from 'supertest';
import type { Library } from "@prisma/client";

describe('Library Controller', () => {
	let libraryController: LibraryController;
	let libraryService: LibraryService;
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule],
			providers: [LibraryController, LibraryService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		libraryController = module.get<LibraryController>(LibraryController);
		libraryService = module.get<LibraryService>(LibraryService);
		app = module.createNestApplication();
		await app.init();

	});

	it('should be defined', () => {
		expect(libraryController).toBeDefined();
		expect(libraryService).toBeDefined();
	});

	describe('Create Library (POST /libraries/new)', () => {
		it("should create a library", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Music',
					name: 'My Library 1'
				})
				.expect(201)
				.expect((res) => {
					const library: Library = res.body
					expect(library.id).toBeDefined();
					expect(library.slug).toBe('my-library-1');
					expect(library.name).toBe('My Library 1');
					expect(library.path).toBe('/Music');
				});
		});

		it("should fail, as it already exists", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Path',
					name: 'My Library 1'
				})
				.expect(409);
		});
	})

});