import SettingsService from './settings.service';
import * as fs from 'fs';
import { FakeFileManagerModule, FakeFileManagerService } from 'test/FakeFileManagerModule';
import FileManagerService from 'src/file-manager/file-manager.service';
import { InvalidSettingsFileException, InvalidSettingsTypeException, MissingSettingsException, SettingsFileNotFoundException } from './settings.exception';
import type Settings from './models/settings';
import { createTestingModule } from 'test/TestModule';

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
		const moduleRef = await createTestingModule({
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
			expect(settingsService.settingsValues).toStrictEqual(<Settings>{
				dataFolder: '/var/lib/meelo',
				trackRegex: ['regex1', 'regex2'],
				metadata: {
					source: "embedded",
					order: "only"
				}
			})
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
			expectExceptionWhenParsing('settings-missing-regex.json', MissingSettingsException);
		});

		it('should throw because the file is missing the base data folder field', async () => {
			expectExceptionWhenParsing('settings-missing-data-folder.json', MissingSettingsException);
		});

		it('should throw because the file is missing the metadata', async () => {
			expectExceptionWhenParsing('settings-missing-metadata.json', MissingSettingsException);
		});

		it('should throw because the file is missing the metadata order', async () => {
			expectExceptionWhenParsing('settings-missing-metadata-order.json', MissingSettingsException);
		});

		it('should throw because the file is missing the metadata source', async () => {
			expectExceptionWhenParsing('settings-missing-metadata-source.json', MissingSettingsException);
		});

		it('should throw because the RegExp array is empty', async () => {
			expectExceptionWhenParsing('settings-empty-regex.json', InvalidSettingsFileException);
		});

		it('should throw because a field data type is incorrect', async () => {
			expectExceptionWhenParsing('settings-wrong-type.json', InvalidSettingsTypeException);
			expectExceptionWhenParsing('settings-wrong-type-metadata-source.json', InvalidSettingsTypeException);
		});
	});
})