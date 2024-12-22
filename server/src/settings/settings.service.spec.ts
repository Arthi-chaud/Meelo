import SettingsService from "./settings.service";
import * as fs from "fs";
import {
	InvalidSettingsFileException,
	MissingSettingsException,
	SettingsFileNotFoundException,
} from "./settings.exception";
import { createTestingModule } from "test/test-module";
import SettingsModule from "./settings.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { TestingModule } from "@nestjs/testing";

describe("Settings Service", () => {
	let settingsService: SettingsService;
	let fileManagerService: FileManagerService;
	let moduleRef: TestingModule;
	beforeAll(async () => {
		moduleRef = await createTestingModule({
			imports: [SettingsModule, FileManagerModule],
		}).compile();
		fileManagerService = moduleRef.get(FileManagerService);
		settingsService = moduleRef.get<SettingsService>(SettingsService);
	});

	afterAll(async () => {
		await moduleRef.close();
	});

	describe("Load Env", () => {
		it("should sets all values if valid setting file", async () => {
			expect(settingsService.settingsValues).toMatchObject({
				dataFolder: "test/assets/",
				meeloFolder: "test/assets/",
				allowAnonymous: false,
			});
		});
	});
});
