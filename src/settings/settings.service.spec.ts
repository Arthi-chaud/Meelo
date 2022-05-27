import { Test } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import * as fs from 'fs';
import { FakeFileManagerService } from 'test/FakeFileManagerModule';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { InvalidSettingsFileException, SettingsFileNotFoundException } from './settings.exception';

describe('Settings Service', () => {
	let settingsService: SettingsService;
	let fileManagerService: FakeFileManagerService;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [SettingsService, {
				provide: FileManagerService,
				useClass: FakeFileManagerService
			}],
		}).compile();
		fileManagerService = moduleRef.get<FileManagerService>(FileManagerService);
		jest.spyOn(fileManagerService, 'configFolderPath', 'get').mockReturnValue('test');
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
			const testBody = () => {
				jest.spyOn(fileManagerService, 'getFileContent').mockImplementation(
					() => fs.readFileSync('test/assets/settings-invalid.json').toString()
				);
				settingsService.loadFromFile();
			}
			expect(testBody).toThrow(InvalidSettingsFileException);
		});

		it('should throw because the file can not be found', async () => {
			const testBody = () => {
				jest.spyOn(fileManagerService, 'getFileContent').mockImplementation(
					() => fs.readFileSync('test/assets/settings-non-existant.json').toString()
				);
				settingsService.loadFromFile();
			}
			expect(testBody).toThrow(SettingsFileNotFoundException);
		});

		it('should throw because the file is missing the regex field', async () => {
			const testBody = () => {
				jest.spyOn(fileManagerService, 'getFileContent').mockImplementation(
					() => fs.readFileSync('test/assets/settings-missing-regex.json').toString()
				);
				settingsService.loadFromFile();
			}
			expect(testBody).toThrow(InvalidSettingsFileException);
		});

		it('should throw because the file is missing the base data folder field', async () => {
			const testBody = () => {
				jest.spyOn(fileManagerService, 'getFileContent').mockImplementation(
					() => fs.readFileSync('test/assets/settings-missing-data-folder.json').toString()
				);
				settingsService.loadFromFile();
			}
			expect(testBody).toThrow(InvalidSettingsFileException);
		});
	});
})