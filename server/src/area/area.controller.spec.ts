import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { Area } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import CreateAreaDTO from "./area.dto";
import AreaModule from "./area.module";

describe("Area Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [AreaModule, PrismaModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Creat Area", () => {
		it("should create area", async () => {
			return request(app.getHttpServer())
				.post(`/areas`)
				.send({
					name: "Belleville",
					sortName: "Belleville",
					mbid: "c5c671b5-acd9-4db6-8206-357dfd73f715",
					type: "City",
				} satisfies CreateAreaDTO)
				.expect(201)
				.expect((res) => {
					const area: Area = res.body;
					expect(area.mbid).toBe(
						"c5c671b5-acd9-4db6-8206-357dfd73f715",
					);
					expect(area.sortName).toBe("Belleville");
					expect(area.type).toBe("City");
				});
		});

		it("should create area with null type", async () => {
			return request(app.getHttpServer())
				.post(`/areas`)
				.send({
					name: "Goutte",
					sortName: "Goutte",
					mbid: "c8189d13-8e73-436d-b6f5-f3940ae9d2eb",
					type: "e" as any,
				} satisfies CreateAreaDTO)
				.expect(201)
				.expect((res) => {
					const area: Area = res.body;
					expect(area.type).toBeNull();
					expect(area.name).toBe("Goutte");
				});
		});

		it("should fail: MBID Alread taken", async () => {
			return request(app.getHttpServer())
				.post(`/areas`)
				.send({
					name: "x",
					sortName: "x",
					mbid: dummyRepository.areaA.mbid,
				} satisfies CreateAreaDTO)
				.expect(409);
		});
	});

	describe("Get Area", () => {
		it("should get area", async () => {
			return request(app.getHttpServer())
				.get(`/areas/${dummyRepository.areaA.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(dummyRepository.areaA);
				});
		});

		it("should error, area does not exist", async () => {
			return request(app.getHttpServer()).get("/areas/-1").expect(404);
		});
	});

	// TODO : Test create
});
