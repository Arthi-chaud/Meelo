import { INestApplication, MiddlewareConsumer, Module } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import ScannerModule from "src/scanner/scanner.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import UserModule from "src/user/user.module";
import UserService from "src/user/user.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import request from "supertest";
import UserController from "src/user/user.controller";
import AuthenticationModule from "./authentication.module";
import { User } from "src/prisma/models";
import SetupApp from "test/setup-app";
import * as Plugins from "../app.plugins";

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
		ScannerModule,
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
				.post(`/auth/login`)
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
				.post(`/auth/login`)
				.send({
					username: user.name,
					password: "azerty1234",
				})
				.expect(401);
		});
		it("Should get the user's access token", async () => {
			await userService.update({ enabled: true }, { name: "user" });
			return request(app.getHttpServer())
				.post(`/auth/login`)
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
				.post(`/auth/login`)
				.send({
					username: "azerty",
					password: "azertyPassword",
				})
				.expect(401);
		});
		it("Should return an error, as credentials are invalid", () => {
			return request(app.getHttpServer())
				.post(`/auth/login`)
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
				.get(`/settings`)
				.auth(adminToken, { type: "bearer" })
				.expect(200);
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.auth(adminToken, { type: "bearer" })
				.expect(200);
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post(`/users/new`)
				.send({ name: "user3", password: "password3" })
				.auth(adminToken, { type: "bearer" })
				.expect(201);
		});
	});

	describe("Test User Role", () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer())
				.get(`/settings`)
				.auth(userToken, { type: "bearer" })
				.expect(401);
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.auth(userToken, { type: "bearer" })
				.expect(200);
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post(`/users/new`)
				.send({ name: "user1", password: "password1" })
				.auth(userToken, { type: "bearer" })
				.expect(201);
		});
	});

	describe("Test Anonymous Role", () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer()).get(`/settings`).expect(401);
		});
		it("Should deny access to route", () => {
			return request(app.getHttpServer()).get(`/albums`).expect(401);
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post(`/users/new`)
				.send({ name: "user2", password: "password1" })
				.expect(201);
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
				.get(`/settings`)
				.set("cookie", `access_token=${adminToken}`)
				.expect(200);
		});
	});
});
