import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import { createTestingModule } from "test/test-module";
import SettingsModule from "./settings.module";
import SettingsService from "./settings.service";

describe("Settings Service", () => {
	let settingsService: SettingsService;
	let moduleRef: TestingModule;
	beforeAll(async () => {
		moduleRef = await createTestingModule({
			imports: [SettingsModule, FileManagerModule, ArtistModule],
		}).compile();
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
				enableUserRegistration: true,
			});
		});
	});
});
