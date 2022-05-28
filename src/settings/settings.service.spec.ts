import { Test } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import * as fs from 'fs';
import { FakeFileManagerModule, FakeFileManagerService } from 'test/FakeFileManagerModule';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { InvalidSettingsFileException, SettingsFileNotFoundException } from './settings.exception';

describe('Settings Service', () => {
	let settingsService: SettingsService;
	let fileManagerService: FakeFileManagerService;

	/**
	 * Runs a tests where settings are loaded from an invalid file, and an error is expected
	 * The test will fail if no error were thrown
	 * @param settingFileName the name of the setting file (not the full path, from test/assets)
	 * @param errorType the type of expected error
	 */
	function expectExceptionWhenParsing(settingFileName: string, errorType: any) {
		const testBody = () => {
			jest.spyOn(fileManagerService, 'getFileContent').mockImplementation(
				() => fs.readFileSync(`test/assets/${settingFileName}`).toString()
			);
			settingsService.loadFromFile();
		}
		expect(testBody).toThrow(errorType);
	}

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [SettingsService, FakeFileManagerModule],
		}).compile();
		fileManagerService = moduleRef.get<FileManagerService>(FileManagerService);
		settingsService = moduleRef.get<SettingsService>(SettingsService);
	});

	describe('loadFromFile', () => {
		it('should sets all values if valid setting file', async () => {
			jest.spyOn(fileManagerService, 'getFileContent').mockImplementation(
				() => fs.readFileSync('test/assets/settings-fake-regex.json').toString()
			);
			settingsService.loadFromFile();
			expect(settingsService.trackRegexes).toStrictEqual(['regex1', 'regex2']);
			expect(settingsService.usePathAsMetadataSource).toBe(true);
			expect(settingsService.usePathToGetReleaseName).toBe(false);
			expect(settingsService.baseDataFolder).toBe('/var/lib/meelo');
		});

		it('should throw because the file is not a valid JSON', async () => {
			expectExceptionWhenParsing('settings-invalid.json', InvalidSettingsFileException);
		});

		it('should throw because the file can not be found', async () => {
			expectExceptionWhenParsing('settings-non-existant.json.json', SettingsFileNotFoundException);
		});

		it('should throw because the file is empty', async () => {
			expectExceptionWhenParsing('settings-empty-file.json', InvalidSettingsFileException);
		});

		it('should throw because the file is missing the regex field', async () => {
			expectExceptionWhenParsing('settings-missing-regex.json', InvalidSettingsFileException);
		});

		it('should throw because the file is missing the base data folder field', async () => {
			expectExceptionWhenParsing('settings-missing-data-folder.json', InvalidSettingsFileException);
		});

		it('should throw because the RegExp array is empty', async () => {
			expectExceptionWhenParsing('settings-empty-regex.json', InvalidSettingsFileException);
		});

		it('should throw because a field data type is incorrect', async () => {
			expectExceptionWhenParsing('settings-wrong-type.json', InvalidSettingsFileException);
		});
	});
})