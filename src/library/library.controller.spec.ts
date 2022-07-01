import type { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import LibraryController from "./library.controller";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";
import IllustrationModule from "src/illustration/illustration.module";

describe('Library Controller', () => {
	let controller: LibraryController;
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule],
			providers: [LibraryController, LibraryService, PrismaService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		controller = module.get<LibraryController>(LibraryController);
		app = module.createNestApplication();
		await app.init();
		
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	// describe('Create Library', () => { 
	// 	it("should create a library (GET /libraries/new)", () => {
	// 		return request(app.getHttpServer())
	// 			.post('/libraries/new')
	// 			.set(<LibraryDto>({
	// 				path: '/Music',
	// 				name: 'My Library 1'
	// 			}))
    //   			.expect(201)
    //   			.expect(<Library>{
	// 				path: '/Music',
	// 				name: 'My Library 1',
	// 				slug: 'my-library-1',
	// 			});
	// 	});
	//  })

});