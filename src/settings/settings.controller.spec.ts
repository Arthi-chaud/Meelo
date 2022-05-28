import { Test, TestingModule } from '@nestjs/testing';
import { FakeFileManagerModule, FakeFileManagerService } from 'test/FakeFileManagerModule';
import { SettingsController } from './settings.controller';
import { SettingsModule } from './settings.module';
import * as fs from 'fs';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';

describe('Settings Controller', () => {
	let controller: SettingsController;
	let fileService: FakeFileManagerService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [SettingsModule, FileManagerModule],
			providers: [SettingsController],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();

		fileService = module.get<FileManagerService>(FileManagerService);
		controller = module.get<SettingsController>(SettingsController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should return the settings', () => {
		expect(controller.getSettings()).toStrictEqual
			(JSON.parse(fs.readFileSync('test/assets/settings.json').toString())
		);
	});

	it('should return the newly-loaded settings', () => {
		jest.spyOn(fileService, 'getFileContent').mockImplementation(
			() => fs.readFileSync('test/assets/settings2.json').toString()
		);
		controller.reload();
		expect(controller.getSettings()).toStrictEqual
			(JSON.parse(fs.readFileSync('test/assets/settings2.json').toString())
		);
	});
});
