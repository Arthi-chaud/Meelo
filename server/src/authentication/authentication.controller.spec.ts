import {
	type INestApplication,
	type MiddlewareConsumer,
	Module,
} from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import ParserModule from "src/parser/parser.module";
import type { User } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import type Settings from "src/settings/models/settings";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import UserController from "src/user/user.controller";
import UserModule from "src/user/user.module";
import UserService from "src/user/user.service";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import * as Plugins from "../app.plugins";
import {
	MissingApiKeyPermissionsException,
	UnauthorizedAnonymousRequestException,
} from "./authentication.exception";
import AuthenticationModule from "./authentication.module";

jest.setTimeout(120000);

@Module({
	imports: [
		AuthenticationModule,
		UserModule,
		FileManagerModule,
		PrismaModule,
		ArtistModule,
		AlbumModule,
		PrismaModule,
		ReleaseModule,
		ParserModule,
		SongModule,
		TrackModule,
		IllustrationModule,
		GenreModule,
		SettingsModule,
	],
	providers: [
		UserService,
		PrismaService,
		UserController,
		...Plugins.AppProviders,
	],
})
class TestAuthenticationModule {
	configure(consumer: MiddlewareConsumer) {
		Plugins.applyMiddlewares(consumer);
	}
}

describe("Authentication Controller & Role Management", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let userService: UserService;
	let admin: User;
	let user: User;
	let adminToken: string;
	let userToken: string;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [TestAuthenticationModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		(module as any).configure = (consumer: MiddlewareConsumer) => {
			Plugins.applyMiddlewares(consumer);
		};
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		userService = module.get(UserService);
		await dummyRepository.onModuleInit();
		await dummyRepository.user.deleteMany({});
		admin = await userService.create({
			name: "admin",
			password: "azerty1234",
			admin: true,
		});
		user = await userService.create({
			name: "user",
			password: "azerty1234",
			admin: false,
		});
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Login", () => {
		it("Should get the Admin's access token", () => {
			return request(app.getHttpServer())
				.post("/auth/login")
				.send({
					username: admin.name,
					password: "azerty1234",
				})
				.expect((res) => {
					adminToken = res.body.access_token;
					expect(adminToken).toBeDefined();
				});
		});
		it("Should return an error, as user is not enabled", () => {
			return request(app.getHttpServer())
				.post("/auth/login")
				.send({
					username: user.name,
					password: "azerty1234",
				})
				.expect(401);
		});
		it("Should get the user's access token", async () => {
			await userService.update({ enabled: true }, { name: user.name });
			return request(app.getHttpServer())
				.post("/auth/login")
				.send({
					username: user.name,
					password: "azerty1234",
				})
				.expect((res) => {
					userToken = res.body.access_token;
					expect(userToken).toBeDefined();
				});
		});
		it("Should return an error, as user does not exist", () => {
			return request(app.getHttpServer())
				.post("/auth/login")
				.send({
					username: "azerty",
					password: "azertyPassword",
				})
				.expect(401);
		});
		it("Should return an error, as credentials are invalid", () => {
			return request(app.getHttpServer())
				.post("/auth/login")
				.send({
					username: user.name,
					password: "userPassword",
				})
				.expect(401);
		});
	});

	describe("Test Admin Role", () => {
		it("Should allow access to admin-only route", () => {
			return request(app.getHttpServer())
				.get("/settings")
				.auth(adminToken, { type: "bearer" })
				.expect(200);
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get("/albums")
				.auth(adminToken, { type: "bearer" })
				.expect(200);
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post("/users")
				.auth(adminToken, { type: "bearer" })
				.send({ name: "user5", password: "password5" })
				.expect(201);
		});
	});

	describe("Test User Role", () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer())
				.get("/users")
				.auth(userToken, { type: "bearer" })
				.expect(401);
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get("/albums")
				.auth(userToken, { type: "bearer" })
				.expect(200);
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({ name: "user1", password: "password1" })
				.auth(userToken, { type: "bearer" })
				.expect(201);
		});
	});

	describe("Test Anonymous Role", () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer()).get("/users").expect(401);
		});
		it("Should deny access to route", () => {
			return request(app.getHttpServer()).get("/albums").expect(401);
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({ name: "user10", password: "password10" })
				.expect(201);
		});
	});
	describe("Test Microservice role", () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer())
				.get("/users")
				.set("x-api-key", "a")
				.expect(401)
				.expect((r) => {
					expect(r.body.message).toBe(
						new UnauthorizedAnonymousRequestException().message,
					);
				});
		});
		it("Should deny access to route", () => {
			return request(app.getHttpServer())
				.get("/albums")
				.set("x-api-key", "a")
				.expect(401)
				.expect((r) => {
					expect(r.body.message).toBe(
						new UnauthorizedAnonymousRequestException().message,
					);
				});
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get("/libraries")
				.set("x-api-key", "a")
				.expect(200);
		});
		it("Should deny access to route (bad api key)", () => {
			return request(app.getHttpServer())
				.get("/libraries")
				.set("x-api-key", "b")
				.expect(401)
				.expect((r) => {
					expect(r.body.message).toBe(
						new MissingApiKeyPermissionsException().message,
					);
				});
		});
	});
	describe("Test User Deletion", () => {
		it("Should Not delete, as the requested user is the current user", () => {
			return request(app.getHttpServer())
				.delete(`/users/${admin.id}`)
				.set("cookie", `access_token=${adminToken}`)
				.expect(400);
		});
		it("Should delete user", () => {
			return request(app.getHttpServer())
				.delete(`/users/${user.id}`)
				.set("cookie", `access_token=${adminToken}`)
				.expect(200);
		});
		it("Should not delete user, not authentified", () => {
			return request(app.getHttpServer())
				.delete(`/users/${user.id}`)
				.expect(401);
		});
	});
	describe("Test Access Token Middlewre", () => {
		it("Should Accept access token cookie", () => {
			return request(app.getHttpServer())
				.get("/settings")
				.set("cookie", `access_token=${adminToken}`)
				.expect(200);
		});
	});

	describe("Test allowed Anonymous access", () => {
		it("Should Reject Anonymous request ", () => {
			jest.spyOn(
				SettingsService.prototype,
				"settingsValues",
				"get",
			).mockReturnValueOnce({
				allowAnonymous: true,
			} as Settings);
			return request(app.getHttpServer()).get("/users").expect(401);
		});
		it("Should Accept Anonymous request ", async () => {
			const mock = jest.spyOn(
				SettingsService.prototype,
				"settingsValues",
				"get",
			);
			mock.mockReturnValue({
				allowAnonymous: true,
			} as Settings);
			await request(app.getHttpServer()).get("/libraries").expect(200);
			mock.mockReset();
		});
		it("Should Reject Anonymous request for User route ", () => {
			jest.spyOn(
				SettingsService.prototype,
				"settingsValues",
				"get",
			).mockReturnValueOnce({
				allowAnonymous: true,
			} as Settings);
			return request(app.getHttpServer())
				.get("/users/me")
				.expect(401)
				.expect((r) => {
					expect(r.body.message).toBe(
						new UnauthorizedAnonymousRequestException().message,
					);
				});
		});
	});

	describe("Test disabled user registration", () => {
		it("Should regject", () => {
			jest.spyOn(
				SettingsService.prototype,
				"settingsValues",
				"get",
			).mockReturnValueOnce({
				allowAnonymous: true,
				enableUserRegistration: false,
			} as Settings);
			return request(app.getHttpServer())
				.post("/users")
				.send({ name: "user1", password: "password1" })
				.expect(401);
		});
	});
});
