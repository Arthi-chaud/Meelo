import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import RolesGuard from "src/roles/roles.guard";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import UserModule from "src/user/user.module";
import UserService from "src/user/user.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import JwtAuthGuard from "./jwt/jwt-auth.guard";
import request from 'supertest';
import UserController from "src/user/user.controller";
import AuthenticationModule from "./authentication.module";
import { User } from "src/prisma/models";
import SetupApp from "test/setup-app";

describe('Authentication Controller & Role Management', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let userService: UserService;
	let admin: User;
	let user: User;
	let adminToken: string;
	let userToken: string;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [AuthenticationModule, SettingsModule, UserModule, FileManagerModule, PrismaModule, ArtistModule, AlbumModule, PrismaModule, ReleaseModule, MetadataModule, SongModule, TrackModule, IllustrationModule, GenreModule],
			providers: [UserService, PrismaService, UserController, {
				provide: APP_GUARD,
				useClass: JwtAuthGuard,
			},{
				provide: APP_GUARD,
				useClass: RolesGuard,
			}],
		}).overrideProvider(PrismaService).useClass(TestPrismaService)
		.overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		userService = module.get(UserService);
		await dummyRepository.onModuleInit();
		admin = await userService.create({ name: 'admin', password: 'azerty1234', admin: true });
		user = await userService.create({ name: 'user', password: 'azerty1234', admin: false });
	});

	describe('Login', () => {
		it("Should get the Admin's access token", () => {
			return request(app.getHttpServer())
				.post(`/auth/login`)
				.send({
					username: admin.name,
					password: 'azerty1234'
				})
				.expect((res) => {
					adminToken = res.body.access_token;
					expect(adminToken).toBeDefined();
				})
		});
		it("Should return an error, as user is not enabled", () => {
			return request(app.getHttpServer())
				.post(`/auth/login`)
				.send({
					username: user.name,
					password: 'azerty1234'
				}).expect(401);
		});
		it("Should get the user's access token", async () => {
			await userService.update({ enabled: true }, { byName: { name: 'user' } });
			return request(app.getHttpServer())
				.post(`/auth/login`)
				.send({
					username: user.name,
					password: 'azerty1234'
				})
				.expect((res) => {
					userToken = res.body.access_token;
					expect(userToken).toBeDefined();
				})
		});
		it("Should return an error, as user does not exist", () => {
			return request(app.getHttpServer())
				.post(`/auth/login`)
				.send({
					username: 'azerty',
					password: 'azertyPassword'
				})
				.expect(404)
		});
		it("Should return an error, as credentials are invalid", () => {
			return request(app.getHttpServer())
				.post(`/auth/login`)
				.send({
					username: user.name,
					password: 'userPassword'
				})
				.expect(403)
		});
	});
	
	describe('Test Admin Role', () => {
		it("Should allow access to admin-only route", () => {
			return request(app.getHttpServer())
				.get(`/settings`)
				.auth(adminToken, { type: 'bearer' })
				.expect(200)
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.auth(adminToken, { type: 'bearer' })
				.expect(200)
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post(`/users/new`)
				.send({ name: 'user3', password: 'password3' })
				.auth(adminToken, { type: 'bearer' })
				.expect(201)
		});
	});
	
	describe('Test User Role', () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer())
				.get(`/settings`)
				.auth(userToken, { type: 'bearer' })
				.expect(401)
		});
		it("Should allow access to route", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.auth(userToken, { type: 'bearer' })
				.expect(200)
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post(`/users/new`)
				.send({ name: 'user1', password: 'password1' })
				.auth(userToken, { type: 'bearer' })
				.expect(201)
		});
	});

	describe('Test Anonymous Role', () => {
		it("Should deny access to admin-only route", () => {
			return request(app.getHttpServer())
				.get(`/settings`)
				.expect(401)
		});
		it("Should deny access to route", () => {
			return request(app.getHttpServer())
				.get(`/albums`)
				.expect(401)
		});
		it("Should allow access to public route", () => {
			return request(app.getHttpServer())
				.post(`/users/new`)
				.send({ name: 'user2', password: 'password1' })
				.expect(201)
		});
	});
});