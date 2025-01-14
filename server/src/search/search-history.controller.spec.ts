import { createTestingModule } from "test/test-module";
import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import SongModule from "src/song/song.module";
import TestPrismaService from "test/test-prisma.service";
import SetupApp from "test/setup-app";
import * as Plugins from "../app.plugins";
import ArtistModule from "src/artist/artist.module";
import AlbumModule from "src/album/album.module";
import { SearchModule } from "./search.module";
import UserModule from "src/user/user.module";
import UserService from "src/user/user.service";
import PrismaModule from "src/prisma/prisma.module";
import AuthenticationModule from "src/authentication/authentication.module";
import SettingsModule from "src/settings/settings.module";

jest.setTimeout(60000);

describe("Search History Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let token: string;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				SongModule,
				ArtistModule,
				AlbumModule,
				AuthenticationModule,
				SearchModule,
				UserModule,
				PrismaModule,
				SettingsModule,
			],
			providers: [...Plugins.AppProviders],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		const userService = module.get(UserService);
		await dummyRepository.onModuleInit();
		await userService.create({
			name: "admin",
			password: "azerty1234",
			admin: true,
		});
	});

	beforeAll(async () => {
		const res = await request(app.getHttpServer())
			.post(`/auth/login`)
			.send({
				username: "admin",
				password: "azerty1234",
			});
		token = res.body.access_token;
	});

	afterAll(async () => {
		await app.close();
	});

	describe("POST Search History Entry", () => {
		it("should save search history entry", () => {
			return request(app.getHttpServer())
				.post(`/search/history`)
				.send({ songId: dummyRepository.songA2.id })
				.auth(token, { type: "bearer" })
				.expect(201);
		});

		it("should return an error (unauthorised)", () => {
			return request(app.getHttpServer())
				.post(`/search/history`)
				.send({ songId: dummyRepository.songA2.id })
				.expect(401);
		});
		it("should return an error (song not found)", () => {
			return request(app.getHttpServer())
				.post(`/search/history`)
				.send({ songId: 2 ^ 53 })
				.auth(token, { type: "bearer" })
				.expect(404);
		});
		it("should return an error (empty dto)", () => {
			return request(app.getHttpServer())
				.post(`/search/history`)
				.send({})
				.auth(token, { type: "bearer" })
				.expect(400);
		});
		it("should return an error (multiple fields set in dto)", () => {
			return request(app.getHttpServer())
				.post(`/search/history`)
				.send({
					songId: dummyRepository.songA2.id,
					artistId: dummyRepository.artistA.id,
				})
				.auth(token, { type: "bearer" })
				.expect(400);
		});
	});
});
