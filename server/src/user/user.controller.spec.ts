import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { TestingModule } from "@nestjs/testing";
import { AppProviders } from "src/app.plugins";
import { UnauthorizedAnonymousRequestException } from "src/authentication/authentication.exception";
import AuthenticationModule from "src/authentication/authentication.module";
import FileModule from "src/file/file.module";
import type { User } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import UserModule from "./user.module";
import UserService from "./user.service";

describe("User Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let adminUser: User;
	let user: User;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PrismaModule, FileModule, UserModule],
			providers: [PrismaService, UserService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		await dummyRepository.user.deleteMany({});
	});

	afterAll(async () => {
		await module.close();
		await app.close();
	});

	describe("Create a user account", () => {
		it("Should create the admin user", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({
					name: "admin",
					password: "admin1234",
				})
				.expect(201)
				.expect((res) => {
					adminUser = res.body;
					expect(adminUser.admin).toBe(true);
					expect(adminUser.name).toBe("admin");
					expect(adminUser.enabled).toBe(true);
					expect(adminUser.id).toBeDefined();
				});
		});

		it("Should create the user user", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({
					name: "user",
					password: "user1234",
				})
				.expect(201)
				.expect((res) => {
					user = res.body;
					expect(user.admin).toBe(false);
					expect(user.name).toBe("user");
					expect(user.enabled).toBe(false);
					expect(user.id).toBeDefined();
				});
		});

		it("Should return an error, as user already exists", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({
					name: "user",
					password: "user123456",
				})
				.expect(409);
		});

		it("Should return an error, as username is not long enough", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({
					name: "use",
					password: "user123456",
				})
				.expect(400);
		});

		it("Should return an error, as password is badly formed", () => {
			return request(app.getHttpServer())
				.post("/users")
				.send({
					name: "admi",
					password: "user",
				})
				.expect(400);
		});
	});

	describe("Get all user accounts", () => {
		it("Should get all the user account", () => {
			return request(app.getHttpServer())
				.get("/users")
				.expect(200)
				.expect((res) => {
					const users: User[] = res.body.items;
					expect(users.length).toBe(2);
					expect(users).toContainEqual(user);
					expect(users).toContainEqual(adminUser);
				});
		});

		it("Should get the first user account (using sort)", () => {
			return request(app.getHttpServer())
				.get("/users?take=1&sortBy=id")
				.expect(200)
				.expect((res) => {
					const users: User[] = res.body.items;
					expect(users.length).toBe(1);
					expect(users).toContainEqual(adminUser);
				});
		});
	});

	describe("Get all disabled user accounts", () => {
		it("Should get all the user account", () => {
			return request(app.getHttpServer())
				.get("/users/disabled")
				.expect(200)
				.expect((res) => {
					const users: User[] = res.body.items;
					expect(users.length).toBe(1);
					expect(users).toContainEqual(user);
				});
		});
	});

	describe("Get all admin user accounts", () => {
		it("Should get all admin account", () => {
			return request(app.getHttpServer())
				.get("/users/admins")
				.expect(200)
				.expect((res) => {
					const users: User[] = res.body.items;
					expect(users.length).toBe(1);
					expect(users).toContainEqual(adminUser);
				});
		});
	});

	describe("Update a user account", () => {
		it("Should enable the user account", () => {
			return request(app.getHttpServer())
				.put(`/users/${user.id}`)
				.send({
					enabled: true,
				})

				.expect((res) => {
					const updatedUser: User = res.body;
					expect(updatedUser).toStrictEqual({
						...user,
						enabled: true,
					});
				});
		});

		it("Should return an error, as id is not known", () => {
			return request(app.getHttpServer()).put("/users/-1").expect(404);
		});

		it("Should return an error, as username is not valid", () => {
			return request(app.getHttpServer())
				.put(`/users/${user.id}`)
				.send({
					name: "use",
				})
				.expect(400);
		});
	});
});

// For password update, plugs in authentication guards
describe("User Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let userToken: string;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				FileModule,
				UserModule,
				SettingsModule,
				AuthenticationModule,
			],
			providers: [PrismaService, UserService, ...AppProviders],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		userToken = module.get(JwtService).sign({
			name: dummyRepository.user1.name,
			id: dummyRepository.user1.id,
		});
	});

	afterAll(async () => {
		await module.close();
		await app.close();
	});

	describe("Update a user password", () => {
		it("Should return an error: password is incorrect", () => {
			return request(app.getHttpServer())
				.post(`/users/me/password`)
				.auth(userToken, { type: "bearer" })
				.send({
					oldPassword: "123",
					newPassword: "MyNewPassword",
				})
				.expect(403);
		});
		it("Should return an error: new password is too short", () => {
			return request(app.getHttpServer())
				.post(`/users/me/password`)
				.auth(userToken, { type: "bearer" })
				.send({
					oldPassword: "1234",
					newPassword: "0",
				})
				.expect(400);
		});
		it("Should return an error: anonymous request", () => {
			return request(app.getHttpServer())
				.post(`/users/me/password`)
				.send({
					oldPassword: "",
					newPassword: "",
				})
				.expect(401)
				.expect(({ body }) =>
					expect(body.message).toBe(
						new UnauthorizedAnonymousRequestException().message,
					),
				);
		});

		it("Should update the password", async () => {
			await request(app.getHttpServer())
				.post(`/users/me/password`)
				.auth(userToken, { type: "bearer" })
				.send({
					oldPassword: "1234",
					newPassword: "MyNewPassword",
				})
				.expect(201);
			let token = "";
			await request(app.getHttpServer())
				.post(`/auth/login`)
				.send({
					username: dummyRepository.user1.name,
					password: "MyNewPassword",
				})
				.expect(201)
				.expect(async ({ body }) => {
					token = body.access_token;
				});

			await request(app.getHttpServer())
				.get(`/users/me`)
				.auth(token, { type: "bearer" })
				.expect(200);
		});
	});
});
