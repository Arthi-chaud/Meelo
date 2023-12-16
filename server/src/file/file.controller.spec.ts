import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { File } from "src/prisma/models";
import LibraryModule from "src/library/library.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import FileModule from "./file.module";
import request from "supertest";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";

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

	afterAll(() => {
		module.close();
		app.close();
	});

	describe("Get File", () => {
		it("should find the file", async () => {
			return request(app.getHttpServer())
				.get(`/files/${dummyRepository.fileA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const file: File = res.body;
					expect(file).toStrictEqual({
						...dummyRepository.fileA1_1,
						registerDate:
							dummyRepository.fileA1_1.registerDate.toISOString(),
					});
				});
		});
		it("should return an error, as the file does not exist", async () => {
			return request(app.getHttpServer()).get(`/files/${-1}`).expect(404);
		});
	});

	describe("Stream File File", () => {
		it("should return an error, as the source file does not exist", async () => {
			return request(app.getHttpServer())
				.get(`/files/${dummyRepository.fileA1_1.id}/stream`)
				.expect(404);
		});
	});
});
