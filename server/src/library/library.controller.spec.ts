import { INestApplication } from "@nestjs/common";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import LibraryController from "./library.controller";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";
import IllustrationModule from "src/illustration/illustration.module";
import request from 'supertest';
import type { Library } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";
import TasksModule from "src/tasks/tasks.module";
import SetupApp from "test/setup-app";

describe('Library Controller', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let newLibrary: Library;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [LibraryModule, FileManagerModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule, GenreModule, LyricsModule, TasksModule],
			providers: [LibraryController, LibraryService, PrismaService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		
	});

	afterAll(() => {
		module.close();
		app.close();
	});

	describe('Create Library (POST /libraries/new)', () => {
		it("should create a library", async () => {
			return request(app.getHttpServer())
				.post('/libraries/new')
				.send({
					path: 'Music 3/',
					name: 'My New Library'
				})
				.expect(201)
				.expect((res) => {
					const library = res.body;
					expect(library.id).toBeDefined();
					expect(library.slug).toBe('my-new-library');
					expect(library.name).toBe('My New Library');
					expect(library.path).toBe('Music 3');
					newLibrary = library;
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
					name: 'Library'
				})
				.expect(409);
		});
	});

	describe('Get a Library (GET /libraries/:id)', () => {
		it("should get the library", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library1.id}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(dummyRepository.library1)
				});
		});

		it("should get the library (w/ slug)", async () => {
			return request(app.getHttpServer())
				.get(`/libraries/${dummyRepository.library2.slug}`)
				.expect(200)
				.expect((res) => {
					const library = res.body;
					expect(library).toStrictEqual(dummyRepository.library2)
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
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(3);
					expect(libraries).toContainEqual(dummyRepository.library1);
					expect(libraries).toContainEqual(dummyRepository.library2);
					expect(libraries).toContainEqual(newLibrary);
				});
		});

		it("should get all the libraries, sorted by name", async () => {
			return request(app.getHttpServer())
				.get('/libraries?sortBy=name&order=desc')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(3);
					expect(libraries[0]).toStrictEqual(newLibrary);
					expect(libraries[1]).toStrictEqual(dummyRepository.library2);
					expect(libraries[2]).toStrictEqual(dummyRepository.library1);
				});
		});

		it("should skip the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?skip=1&take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(1);
					expect(libraries).toContainEqual(dummyRepository.library2);
				});
		});

		it("should take only the first library", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(1);
					expect(libraries).toContainEqual(dummyRepository.library1);
				});
		});

		it("should take none", async () => {
			return request(app.getHttpServer())
				.get('/libraries?take=1&skip=3')
				.expect(200)
				.expect((res) => {
					const libraries: Library[] = res.body.items;
					expect(libraries.length).toBe(0);
				});
		});
	});

	describe("Get all Related Songs (PUT /libraries/:id)", () => {
		it("should update the path", async () => {
			return request(app.getHttpServer())
				.put(`/libraries/${dummyRepository.library1.slug}`)
				.send({
					path: '/hello-world',
				})
				.expect(200)
				.expect((res) => {
					const updatedLibrary: Library = res.body;
					expect(updatedLibrary).toStrictEqual({
						...dummyRepository.library1,
						path: '/hello-world'
					});
				});
		});
		it("should update the name, and the slug", async () => {
			return request(app.getHttpServer())
				.put(`/libraries/${dummyRepository.library2.slug}`)
				.send({
					name: 'Hello World Library',
				})
				.expect(200)
				.expect((res) => {
					const updatedLibrary: Library = res.body;
					expect(updatedLibrary).toStrictEqual({
						...dummyRepository.library2,
						name: 'Hello World Library',
						slug: 'hello-world-library'
					});
				});
		});
	})
});