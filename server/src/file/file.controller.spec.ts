import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import LibraryModule from "src/library/library.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import type { File } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { expectedFileResponse } from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import FileModule from "./file.module";

describe("File Controller", () => {
	let app: INestApplication;

	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [FileModule, LibraryModule, PrismaModule, LyricsModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Get File", () => {
		it("should find the file", async () => {
			return request(app.getHttpServer())
				.get(`/files/${dummyRepository.fileA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const file: File = res.body;
					expect(file).toStrictEqual(
						expectedFileResponse(dummyRepository.fileA1_1),
					);
					expect(file.fingerprint).toBe("ACOUSTID");
				});
		});
		it("should return an error, as the file does not exist", async () => {
			return request(app.getHttpServer()).get(`/files/${-1}`).expect(404);
		});
	});

	describe("Get Many Files", () => {
		describe("In Library", () => {
			it("should get file in one library", async () => {
				return request(app.getHttpServer())
					.get(`/files?library=${dummyRepository.library2.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(2);

						expect(files[0]).toStrictEqual(
							expectedFileResponse(dummyRepository.fileA2_1),
						);
						expect(files[1]).toStrictEqual(
							expectedFileResponse(dummyRepository.fileB1_1),
						);
					});
			});
			it("should get files in other library", async () => {
				return request(app.getHttpServer())
					.get(`/files?library=${dummyRepository.library1.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(3);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_1),
						);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_2Video),
						);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileC1_1),
						);
					});
			});
		});
		describe("In Directory", () => {
			it("should get files in one directory", async () => {
				return request(app.getHttpServer())
					.get("/files?inFolder=Artist A/Album A")
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(2);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_1),
						);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_2Video),
						);
					});
			});
			it("should get files in sub directory", async () => {
				return request(app.getHttpServer())
					.get("/files?inFolder=Artist A/Album B")
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(1);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA2_1),
						);
					});
			});
			it("should get one file in directory", async () => {
				return request(app.getHttpServer())
					.get("/files?inFolder=Compilations")
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(1);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileC1_1),
						);
					});
			});
		});
		describe("In Album", () => {
			it("should get files from album", async () => {
				return request(app.getHttpServer())
					.get(`/files?album=${dummyRepository.compilationAlbumA.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(1);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileC1_1),
						);
					});
			});
		});
		describe("In Release", () => {
			it("should get files from release", async () => {
				return request(app.getHttpServer())
					.get(`/files?release=${dummyRepository.releaseB1_1.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(1);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileB1_1),
						);
					});
			});
		});
		describe("In Song", () => {
			it("should get files from song", async () => {
				return request(app.getHttpServer())
					.get(`/files?song=${dummyRepository.songA1.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(2);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_1),
						);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_2Video),
						);
					});
			});
			it("should get files from other song", async () => {
				return request(app.getHttpServer())
					.get(`/files?song=${dummyRepository.songA2.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(1);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA2_1),
						);
					});
			});
		});
		describe("In Track", () => {
			it("should get file from track", async () => {
				return request(app.getHttpServer())
					.get(`/files?track=${dummyRepository.trackA1_2Video.id}`)
					.expect(200)
					.expect((res) => {
						const files: File[] = res.body.items;
						expect(files.length).toBe(1);
						expect(files).toContainEqual(
							expectedFileResponse(dummyRepository.fileA1_2Video),
						);
					});
			});
		});
	});
});
