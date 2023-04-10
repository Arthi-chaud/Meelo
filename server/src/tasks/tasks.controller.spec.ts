import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TasksModule from "./tasks.module";
import TaskRunner from "./tasks.runner";
import request from "supertest";
import PrismaModule from "src/prisma/prisma.module";
import TestPrismaService from "test/test-prisma.service";
import PrismaService from "src/prisma/prisma.service";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const expectedTaskResponse = {
	status: `Task added to queue`
}


describe('Task Controller', () => {
	let app: INestApplication;
	let taskRunner: TaskRunner;
	let dummyRepository: TestPrismaService

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [TasksModule, PrismaModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		taskRunner = module.get(TaskRunner);
	});

	afterAll(() => {
		module.close();
		app.close();
	});

	it('should run housekeeping', async() => {
		const spy = jest.spyOn(taskRunner, 'housekeeping');
		spy.mockImplementationOnce(async () => {});

		const res = await request(app.getHttpServer())
			.get(`/tasks/housekeeping`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	})

	it('should run scan', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'scanLibrary');
		spy.mockImplementationOnce(async () => {});
		jest.spyOn(dummyRepository.library, 'findMany')
			.mockResolvedValueOnce([dummyRepository.library1]);


		const res = await request(app.getHttpServer())
			.get(`/tasks/scan`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	});

	it('should run clean', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'cleanLibrary');
		spy.mockImplementationOnce(async () => {});
		jest.spyOn(dummyRepository.library, 'findMany')
			.mockResolvedValueOnce([dummyRepository.library1]);


		const res = await request(app.getHttpServer())
			.get(`/tasks/clean`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	});

	it('should fetch external metadata', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'fetchExternalMetadata');
		spy.mockImplementationOnce(async () => {});


		const res = await request(app.getHttpServer())
			.get(`/tasks/fetch-external-metadata`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	})

	it('should refresh metadata', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'refreshLibraryMetadata');
		spy.mockImplementationOnce(async () => {});
		jest.spyOn(dummyRepository.library, 'findMany')
			.mockResolvedValueOnce([dummyRepository.library1]);


		const res = await request(app.getHttpServer())
			.get(`/tasks/refresh-metadata`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	})

	it('should run scan on library', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'scanLibrary');
		spy.mockImplementationOnce(async () => {});

		const res = await request(app.getHttpServer())
			.get(`/tasks/scan/1`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	})

	it('should run clean on library', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'cleanLibrary');
		spy.mockImplementationOnce(async () => {});

		const res = await request(app.getHttpServer())
			.get(`/tasks/clean/1`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	});

	it('should refresh metadata on library', async () => {
		const spy = jest.spyOn(TaskRunner.prototype as any, 'refreshLibraryMetadata');
		spy.mockImplementationOnce(async () => {});

		const res = await request(app.getHttpServer())
			.get(`/tasks/refresh-metadata/1`)
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	});
});