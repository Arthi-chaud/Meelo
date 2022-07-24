import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { File } from "@prisma/client";
import FileManagerService from "src/file-manager/file-manager.service";
import LibraryModule from "src/library/library.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import FileModule from "./file.module";
import request from 'supertest';
import TestPrismaService from "test/test-prisma.service";

describe('File Controller', () => {
	let app: INestApplication;

	let dummyRepository: TestPrismaService

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileModule, LibraryModule, PrismaModule]
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	describe('Get File', () => {
		it("should find the file", async () => {
			return request(app.getHttpServer())
				.get(`/files/${dummyRepository.fileA1_1.id}`)
				.expect(200)
				.expect((res) => {
					let file: File = res.body;
					expect(file).toStrictEqual({
						...dummyRepository.fileA1_1,
						registerDate: dummyRepository.fileA1_1.registerDate.toISOString()
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
				.get(`/files/${dummyRepository.fileA1_1.id}/stream`)
				.expect(404);
		});
	})
});