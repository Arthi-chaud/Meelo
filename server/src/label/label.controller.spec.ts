import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { Label } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import LabelModule from "./label.module";

describe("Label Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [LabelModule, PrismaModule],
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

	describe("Get Label", () => {
		it("should get label", async () => {
			return request(app.getHttpServer())
				.get(`/labels/${dummyRepository.labelA.slug}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(dummyRepository.labelA);
				});
		});

		it("should error, label does not exist", async () => {
			return request(app.getHttpServer()).get("/labels/-1").expect(404);
		});
	});

	describe("Get Labels", () => {
		it("should get every label", async () => {
			return request(app.getHttpServer())
				.get("/labels")
				.expect(200)
				.expect((res) => {
					const labels: Label[] = res.body.items;
					expect(labels.length).toBe(2);
					expect(labels[0]).toStrictEqual(dummyRepository.labelA);
					expect(labels[1]).toStrictEqual(dummyRepository.labelB);
				});
		});

		it("should sort labels", async () => {
			return request(app.getHttpServer())
				.get("/labels?sortBy=id&order=desc")
				.expect(200)
				.expect((res) => {
					const labels: Label[] = res.body.items;
					expect(labels.length).toBe(2);
					expect(labels[0].id).toBe(dummyRepository.labelB.id);
					expect(labels[1].id).toBe(dummyRepository.labelA.id);
				});
		});

		describe("filter by album", () => {
			it("single album", async () => {
				return request(app.getHttpServer())
					.get(`/labels?album=${dummyRepository.albumA1.slug}`)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(2);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
						expect(labels[1].id).toBe(dummyRepository.labelB.id);
					});
			});

			it("single album (expect 1)", async () => {
				return request(app.getHttpServer())
					.get(`/labels?album=${dummyRepository.albumB1.slug}`)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(1);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
					});
			});
			it("using 'not'", async () => {
				return request(app.getHttpServer())
					.get(`/labels?album=not:${dummyRepository.albumB1.slug}`)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(1);
						expect(labels[0].id).toBe(dummyRepository.labelB.id);
					});
			});
			it("using 'or'", async () => {
				return request(app.getHttpServer())
					.get(
						`/labels?sortBy=id&album=or:${dummyRepository.albumB1.slug},${dummyRepository.albumA1.id}`,
					)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(2);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
						expect(labels[1].id).toBe(dummyRepository.labelB.id);
					});
			});
			it("using 'and'", async () => {
				return request(app.getHttpServer())
					.get(
						`/labels?album=and:${dummyRepository.albumA1.slug},${dummyRepository.albumB1.id}`,
					)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(1);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
					});
			});
		});

		describe("filter by artist", () => {
			it("single artist", async () => {
				return request(app.getHttpServer())
					.get(`/labels?artist=${dummyRepository.artistA.slug}`)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(2);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
						expect(labels[1].id).toBe(dummyRepository.labelB.id);
					});
			});

			it("using 'not'", async () => {
				return request(app.getHttpServer())
					.get(`/labels?artist=not:${dummyRepository.artistB.slug}`)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(1);
						expect(labels[0].id).toBe(dummyRepository.labelB.id);
					});
			});
			it("using 'or'", async () => {
				return request(app.getHttpServer())
					.get(
						`/labels?sortBy=id&artist=or:${dummyRepository.artistB.slug},${dummyRepository.artistA.id}`,
					)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(2);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
						expect(labels[1].id).toBe(dummyRepository.labelB.id);
					});
			});
			it("using 'and'", async () => {
				return request(app.getHttpServer())
					.get(
						`/labels?artist=and:${dummyRepository.artistB.slug},${dummyRepository.artistA.id}`,
					)
					.expect(200)
					.expect((res) => {
						const labels: Label[] = res.body.items;
						expect(labels.length).toBe(1);
						expect(labels[0].id).toBe(dummyRepository.labelA.id);
					});
			});
		});
	});
});
