import { Test, TestingModule } from '@nestjs/testing';
import { FakeFileManagerService } from 'test/FakeFileManagerModule';
import { SettingsController } from './settings.controller';
import { SettingsModule } from './settings.module';
import * as fs from 'fs';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { INestApplication } from '@nestjs/common';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import request from 'supertest';

describe('Settings Controller', () => {
	let controller: SettingsController;
	let fileService: FakeFileManagerService;
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [SettingsModule, FileManagerModule],
			providers: [SettingsController],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();

		fileService = module.get<FileManagerService>(FileManagerService);
		controller = module.get<SettingsController>(SettingsController);
		app = module.createNestApplication();
		await app.init();
		jest.spyOn(fileService, 'getFileContent').mockImplementationOnce(
			() => fs.readFileSync('test/assets/settings.json').toString()
		);
		controller.reload();
	});


	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it(`/GET /settings`, () => {
		return request(app.getHttpServer())
			.get('/settings')
      		.expect(200)
      		.expect(JSON.parse(
				fs.readFileSync('test/assets/settings.json').toString()
			));
	});

	it('/GET /settings/reload', () => {
		jest.spyOn(fileService, 'getFileContent').mockImplementation(
			() => fs.readFileSync('test/assets/settings2.json').toString()
		);
		return request(app.getHttpServer())
			.get('/settings/reload')
			.expect(302);
	});
});
