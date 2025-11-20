import * as fs from "node:fs";
import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import SettingsController from "./settings.controller";
import SettingsModule from "./settings.module";

describe("Settings Controller", () => {
	let controller: SettingsController;
	let fileService: FileManagerService;
	let app: INestApplication;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [FileManagerModule, SettingsModule, ArtistModule],
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

	it("/GET /settings", () => {
		return request(app.getHttpServer())
			.get("/settings")
			.expect(200)
			.expect({
				allowAnonymous: false,
				version: "unknown",
				enableUserRegistration: true,
				transcoderAvailable: false,
			});
	});
});
