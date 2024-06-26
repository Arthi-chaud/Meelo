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

	/**
	 * Runs a tests where settings are loaded from an invalid file, and an error is expected
	 * The test will fail if no error were thrown
	 * @param settingFileName the name of the setting file (not the full path, from test/assets)
	 * @param errorType the type of expected error
	 */
	function expectExceptionWhenParsing(
		settingFileName: string,
		errorType: any,
	) {
		const testBody = () => {
			jest.spyOn(fileManagerService, "getFileContent").mockImplementation(
				() =>
					fs
						.readFileSync(`test/assets/${settingFileName}`)
						.toString(),
			);
			settingsService.loadFromFile();
		};
		expect(testBody).toThrow(errorType);
	}

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

	describe("loadFromFile", () => {
		it("should sets all values if valid setting file", async () => {
			jest.spyOn(fileManagerService, "getFileContent").mockImplementation(
				() =>
					fs
						.readFileSync("test/assets/settings-fake-regex.json")
						.toString(),
			);
			settingsService.loadFromFile();
			expect(settingsService.settingsValues).toMatchObject({
				dataFolder: "test/assets/",
				meeloFolder: "test/assets/",
				trackRegex: ["regex1", "regex2"],
				metadata: {
					source: "embedded",
					order: "only",
					useExternalProviderGenres: true,
				},
			});
		});

		it("should throw because the file is not a valid JSON", async () => {
			expectExceptionWhenParsing(
				"settings-invalid.json",
				InvalidSettingsFileException,
			);
		});

		it("should throw because the file can not be found", async () => {
			expectExceptionWhenParsing(
				"settings-non-existant.json.json",
				SettingsFileNotFoundException,
			);
		});

		it("should throw because the file is empty", async () => {
			expectExceptionWhenParsing(
				"settings-empty-file.json",
				InvalidSettingsFileException,
			);
		});

		it("should throw because the file is missing the regex field", async () => {
			expectExceptionWhenParsing(
				"settings-missing-regex.json",
				MissingSettingsException,
			);
		});

		it("should throw because the file is missing the metadata", async () => {
			expectExceptionWhenParsing(
				"settings-missing-metadata.json",
				MissingSettingsException,
			);
		});

		it("should throw because the file is missing the metadata order", async () => {
			expectExceptionWhenParsing(
				"settings-missing-metadata-order.json",
				MissingSettingsException,
			);
		});

		it("should throw because the file is missing the metadata source", async () => {
			expectExceptionWhenParsing(
				"settings-missing-metadata-source.json",
				MissingSettingsException,
			);
		});

		it("should throw because a nested field is missing", async () => {
			expectExceptionWhenParsing(
				"settings-missing-nested-value.json",
				MissingSettingsException,
			);
		});

		it("should throw because the RegExp array is empty", async () => {
			expectExceptionWhenParsing(
				"settings-empty-regex.json",
				InvalidSettingsFileException,
			);
		});

		it("should throw because a field data type is incorrect", async () => {
			expectExceptionWhenParsing(
				"settings-wrong-type.json",
				InvalidSettingsFileException,
			);
			expectExceptionWhenParsing(
				"settings-wrong-type-metadata-source.json",
				InvalidSettingsFileException,
			);
		});
	});
});
