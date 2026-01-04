import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileModule from "src/file/file.module";
import type { Provider } from "src/prisma/generated/client";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { DuplicateSourcesInExternalMetadataDto } from "./external-metadata.exceptions";
import { ExternalMetadataModule } from "./external-metadata.module";
import type { CreateExternalMetadataDto } from "./models/external-metadata.dto";
import type { ExternalMetadataResponse } from "./models/external-metadata.response";

describe("External Metadata Controller", () => {
	let app: INestApplication;

	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	let createdMetadata: ExternalMetadataResponse;
	let provider: Provider;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				ExternalMetadataModule,
				PrismaModule,
				FileModule,
				ArtistModule,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		provider = await dummyRepository.provider.create({
			data: { slug: "wikipedia", name: "Wikipedia" },
		});
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Save Metadata", () => {
		it("should save album metadata", () => {
			return request(app.getHttpServer())
				.post("/external-metadata")
				.send({
					albumId: dummyRepository.albumA1.id,
					description: "a",
					rating: undefined,
					sources: [{ providerId: provider.id, url: "URL" }],
				} satisfies CreateExternalMetadataDto)
				.expect(201)
				.expect((res) => {
					const entry: ExternalMetadataResponse = res.body;
					expect(entry.description).toBe("a");
					expect(entry.rating).toBe(null);
					expect(entry.sources.length).toBe(1);
					expect(entry.sources[0].providerName).toBe(provider.name);
					expect(entry.sources[0].providerId).toBe(provider.id);
					expect(entry.sources[0].url).toBe("URL");
					createdMetadata = entry;
				});
		});
		it("should return an error, as metadata already exists", () => {
			return request(app.getHttpServer())
				.post("/external-metadata")
				.send({
					albumId: dummyRepository.albumA1.id,
					description: "b",
					rating: undefined,
					sources: [{ providerId: provider.id, url: "URL2" }],
				} satisfies CreateExternalMetadataDto)
				.expect(201)
				.expect((res) => {
					const entry: ExternalMetadataResponse = res.body;
					expect(entry.description).toBe("b");
					expect(entry.rating).toBe(null);
					expect(entry.sources.length).toBe(1);
					expect(entry.sources[0].providerName).toBe(provider.name);
					expect(entry.sources[0].providerId).toBe(provider.id);
					expect(entry.sources[0].url).toBe("URL2");
					createdMetadata = entry;
				});
		});
		it("should return an error, as album does not exist", () => {
			return request(app.getHttpServer())
				.post("/external-metadata")
				.send({
					albumId: 0,
					description: "a",
					rating: undefined,
					sources: [{ providerId: provider.id, url: "URL" }],
				} satisfies CreateExternalMetadataDto)
				.expect(404);
		});

		it("should return an error, duplicate source", () => {
			return request(app.getHttpServer())
				.post("/external-metadata")
				.send({
					albumId: dummyRepository.compilationAlbumA.id,
					description: "a",
					rating: undefined,
					sources: [
						{ providerId: provider.id, url: "URL" },
						{ providerId: provider.id, url: "URL2" },
					],
				} satisfies CreateExternalMetadataDto)
				.expect(400)
				.expect((res) => {
					const message = res.body.message;
					expect(message).toBe(
						new DuplicateSourcesInExternalMetadataDto().message,
					);
				});
		});
	});

	describe("Get Metadata", () => {
		it("should get album metadata", () => {
			return request(app.getHttpServer())
				.get(`/external-metadata?album=${dummyRepository.albumA1.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(createdMetadata);
				});
		});
		it("should return an error, as metadata does not exists", () => {
			return request(app.getHttpServer())
				.get(`/external-metadata?album=${dummyRepository.albumB1.id}`)
				.expect(404);
		});
		it("should return an error, as album does not exist", () => {
			return request(app.getHttpServer())
				.get("/external-metadata?album=-1")
				.expect(404);
		});
		it("should return an error, as no selector were given", () => {
			return request(app.getHttpServer())
				.get("/external-metadata")
				.expect(400);
		});
		it("should return an error, as too many selector were given", () => {
			return request(app.getHttpServer())
				.get("/external-metadata?album=a&artist=b")
				.expect(400);
		});
	});
});
