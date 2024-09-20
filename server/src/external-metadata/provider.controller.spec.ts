import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { ExternalMetadataModule } from "./external-metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SetupApp from "test/setup-app";
import { Provider } from "src/prisma/models";
import { createReadStream, existsSync, readFileSync, ReadStream } from "fs";
import IllustrationService from "src/illustration/illustration.service";
import ProviderService from "./provider.service";

describe("External Provider Controller", () => {
	let app: INestApplication;

	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	let provider: Provider;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [ExternalMetadataModule, PrismaModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		jest.spyOn(
			IllustrationService.prototype,
			"getImageStats",
		).mockImplementation(async () => ({
			blurhash: "",
			colors: [],
			aspectRatio: 0,
		}));
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Create a Provider", () => {
		it("should create a provider", () => {
			return request(app.getHttpServer())
				.post(`/external-providers`)
				.send({
					name: "Wikipedia",
				})
				.expect(201)
				.expect((res) => {
					provider = res.body;
					expect(provider.name).toBe("Wikipedia");
					expect(provider.slug).toBe("wikipedia");
					expect(provider.illustrationId).toBeNull();
				});
		});
		it("should fail as provider already exists", () => {
			return request(app.getHttpServer())
				.post(`/external-providers`)
				.send({
					name: "wikipedia",
				})
				.expect(409);
		});
	});

	describe("Save Provider Icon", () => {
		it("should save provider icon", () => {
			return request(app.getHttpServer())
				.post(`/external-providers/${provider.slug}/icon`)
				.attach("file", createReadStream("test/assets/cover2.jpg"))
				.expect(201)
				.expect(async (res) => {
					const newIllustrationId = res.body.id;
					expect(
						existsSync(
							`test/assets/metadata/${newIllustrationId}/cover.jpg`,
						),
					).toBe(true);
					const updatedProvider = await module
						.get(ProviderService)
						.get({ id: provider.id });
					expect(updatedProvider.illustrationId).toBe(
						newIllustrationId,
					);
				});
		});
		it("should fail as provider does not exist", () => {
			return request(app.getHttpServer())
				.post(`/external-providers/a/icon`)
				.attach("file", createReadStream("test/assets/cover2.jpg"))
				.expect(404);
		});
		it("should fail (bad request)", () => {
			return request(app.getHttpServer())
				.post(`/external-providers/${provider.slug}/icon`)
				.expect(400);
		});
	});
});
