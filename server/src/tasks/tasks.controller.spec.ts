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
import { TasksDescription } from "./models/tasks";
import { HousekeepingModule } from "src/housekeeping/housekeeping.module";

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const expectedTaskResponse = {
	message: `Task started`,
};

describe("Task Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [TasksModule, PrismaModule, HousekeepingModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	it("should fetch external metadata", async () => {
		const spy = jest.spyOn(
			TaskRunner.prototype as any,
			"fetchExternalMetadata",
		);
		spy.mockImplementationOnce(async () => {});

		const res = await request(app.getHttpServer()).get(
			`/tasks/fetch-external-metadata`,
		);
		expect(res.statusCode).toBe(200);
		expect(res.body).toStrictEqual(expectedTaskResponse);
		await delay(2000);
		expect(spy).toBeCalled();
	});

	it("should get current", async () => {
		jest.spyOn(
			TaskRunner.prototype as any,
			"fetchExternalMetadataTask",
		).mockImplementation(async () => {
			await delay(100);
		});

		await request(app.getHttpServer())
			.get(`/tasks/fetch-external-metadata`)
			.expect(200);
		const res = await request(app.getHttpServer()).get(`/tasks`);
		expect(res.body).toStrictEqual({
			active: {
				name: "fetchExternalMetadata",
				description: TasksDescription["fetchExternalMetadata"],
			},
		});
		expect(res.statusCode).toBe(200);
	});
});
