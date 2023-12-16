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
		controller.reload();
	});

	afterAll(() => {
		module.close();
		app.close();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it(`/GET /settings`, () => {
		return request(app.getHttpServer())
			.get("/settings")
			.expect(200)
			.expect({
				...JSON.parse(
					fs.readFileSync("test/assets/settings.json").toString(),
				),
				providers: {
					genius: { enabled: true },
					musicbrainz: { enabled: true },
				},
				meeloFolder: "test/assets/",
			});
	});

	it("/GET /settings/reload", () => {
		jest.spyOn(fileService, "getFileContent").mockImplementation(() =>
			fs.readFileSync("test/assets/settings2.json").toString(),
		);
		return request(app.getHttpServer()).get("/settings/reload").expect(302);
	});
});
