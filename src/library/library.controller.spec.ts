import { INestApplication, ValidationPipe } from "@nestjs/common";
import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
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
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
describe('Library Controller', () => {
	let libraryController: LibraryController;
	let libraryService: LibraryService;
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule],
			providers: [LibraryController, LibraryService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		libraryController = module.get<LibraryController>(LibraryController);
		libraryService = module.get<LibraryService>(LibraryService);
		app = module.createNestApplication();
		app.useGlobalFilters(
			new NotFoundExceptionFilter(),
			new MeeloExceptionFilter()
		);
		app.useGlobalPipes(new ValidationPipe());
		await app.init();

	});

	it('should be defined', () => {
		expect(libraryController).toBeDefined();
		expect(libraryService).toBeDefined();
	});

	describe('Create Library (POST /libraries/new)', () => {
		it("should create a first library", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Music',
					name: 'My Library 1'
				})
				.expect(201)
				.expect((res) => {
					const library: Library = res.body;
					expect(library.id).toBeDefined();
					expect(library.slug).toBe('my-library-1');
					expect(library.name).toBe('My Library 1');
					expect(library.path).toBe('/Music');
				});
		});
		it("should fail, as the body is incomplete", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Path',
				})
				.expect(400);
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
		it("should create a second library", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: '/Music2',
					name: 'My Library 2'
				})
				.expect(201)
				.expect((res) => {
					const library: Library = res.body;
					expect(library.id).toBeDefined();
					expect(library.slug).toBe('my-library-2');
					expect(library.name).toBe('My Library 2');
					expect(library.path).toBe('/Music2');
				});
		});
	});

	describe('Get a Library (GET /libraries/:library)', () => {
		it("should get the library", async () => {
			return request(app.getHttpServer())
				.get('/libraries/my-library-1')
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library.slug).toBe('my-library-1');
					expect(library.name).toBe('My Library 1');
					expect(library.path).toBe('/Music');
					expect(library.files).toBeUndefined();
				});
		});

		it("should throw, as the library does not exist", async () => {
			return request(app.getHttpServer())
				.get('/libraries/my-library-3')
				.expect(404);
		});
	});

	describe('Get a Library (GET /libraries/:library) w/ relation include query params', () => {
		it("should get the library, with its files", async () => {
			return request(app.getHttpServer())
				.get('/libraries/my-library-1?with=files')
				.expect(200)
				.expect((res) => {
					const library: Library & { files: File[] } = res.body;
					expect(library.slug).toBe('my-library-1');
					expect(library.name).toBe('My Library 1');
					expect(library.path).toBe('/Music');
					expect(library.files).toStrictEqual([]);
				});
		});

		it("should get the library, w/ empty query parameter", async () => {
			return request(app.getHttpServer())
				.get('/libraries/my-library-1?with=')
				.expect(200)
				.expect((res) => {
					const library: Library & { files: File[] } = res.body;
					expect(library.slug).toBe('my-library-1');
					expect(library.name).toBe('My Library 1');
					expect(library.path).toBe('/Music');
					expect(library.files).toBeUndefined();
				});
		});

		it("should throw, as the requested relation does not exist", async () => {
			return request(app.getHttpServer())
				.get('/libraries/my-library-1?with=file')
				.expect(400);
		});
	});

	describe('Get all Libraries (GET /libraries)', () => {
		it("should get all the libraries", async () => {
			return request(app.getHttpServer())
				.get('/libraries')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body;
					expect(libraries.length).toBe(2);
					expect(libraries.at(0)!.slug).toBe('my-library-1');
					expect(libraries.at(1)!.slug).toBe('my-library-2');
				});
		});

		it("should skip the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?skip=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body;
					expect(libraries.length).toBe(1);
					expect(libraries.at(0)!.slug).toBe('my-library-2');
				});
		});

		it("should take only the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body;
					expect(libraries.length).toBe(1);
					expect(libraries.at(0)!.slug).toBe('my-library-1');
				});
		});

		it("should take none", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1&skip=2')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body;
					expect(libraries.length).toBe(0);
				});
		});
	});

});