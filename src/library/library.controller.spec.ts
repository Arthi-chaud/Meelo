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
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
describe('Library Controller', () => {
	let libraryController: LibraryController;
	let libraryService: LibraryService;
	let app: INestApplication;

	let library1: Library;
	let library2: Library;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule, IllustrationModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule],
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
					library1 = res.body;
					expect(library1.id).toBeDefined();
					expect(library1.slug).toBe('my-library-1');
					expect(library1.name).toBe('My Library 1');
					expect(library1.path).toBe('/Music');
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
					library2 = res.body;
					expect(library2.id).toBeDefined();
					expect(library2.slug).toBe('my-library-2');
					expect(library2.name).toBe('My Library 2');
					expect(library2.path).toBe('/Music2');
				});
		});
	});

	describe('Get a Library (GET /libraries/:id)', () => {
		it("should get the library", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${library1.id}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(library1)
				});
		});

		it("should throw, as the library does not exist", async () => {
			return request(app.getHttpServer())
				.get('/libraries/-1')
				.expect(404);
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
					expect(libraries.at(0)).toStrictEqual(library1);
					expect(libraries.at(1)).toStrictEqual(library2);
				});
		});

		it("should skip the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?skip=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body;
					expect(libraries.length).toBe(1);
					expect(libraries.at(0)).toStrictEqual(library2);
				});
		});

		it("should take only the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body;
					expect(libraries.length).toBe(1);
					expect(libraries.at(0)).toStrictEqual(library1);
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