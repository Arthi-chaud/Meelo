import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import SettingsController from "./settings.controller";
import SettingsModule from "./settings.module";
import * as fs from "fs";
import FileManagerService from "src/file-manager/file-manager.service";
import type { INestApplication } from "@nestjs/common";
import FileManagerModule from "src/file-manager/file-manager.module";
import request from "supertest";
import SetupApp from "test/setup-app";

describe("Settings Controller", () => {
	let controller: SettingsController;
	let fileService: FileManagerService;
	let app: INestApplication;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [SettingsModule, FileManagerModule],
			controllers: [SettingsController],
		}).compile();

		fileService = module.get<FileManagerService>(FileManagerService);
		controller = module.get<SettingsController>(SettingsController);
		app = await SetupApp(module);
		jest.spyOn(fileService, "getFileContent").mockImplementationOnce(() =>
			fs.readFileSync("test/assets/settings.json").toString(),
		);
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it(`/GET /settings`, () => {
		return request(app.getHttpServer())
			.get("/settings")
			.expect(200)
			.expect({
				allowAnonymous: false,
			});
	});
});
