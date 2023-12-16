import { TestingModule } from "@nestjs/testing";
import FileModule from "src/file/file.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import UserModule from "./user.module";
import UserService from "./user.service";
import { User } from "src/prisma/models";
import {
	InvalidUserCredentialsException,
	UserAlreadyExistsException,
	UserNotFoundException,
	UserNotFoundFromIDException,
} from "./user.exceptions";

describe("User Service", () => {
	let userService: UserService;
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
		await module.get<PrismaService>(PrismaService).onModuleInit();
		userService = module.get<UserService>(UserService);
	});

	afterAll(() => {
		module.close();
	});

	describe("Create user", () => {
		it("should create first user (force admin)", async () => {
			adminUser = await userService.create({
				name: "admin",
				password: "admin123456",
				admin: true,
			});
			expect(adminUser.name).toBe("admin");
			expect(adminUser.admin).toBe(true);
			expect(adminUser.enabled).toBe(true);
			userService.delete({ id: adminUser.id });
		});

		it("should create first user (implicit admin)", async () => {
			adminUser = await userService.create({
				name: "admin1",
				password: "admin123456",
				admin: false,
			});
			expect(adminUser.name).toBe("admin1");
			expect(adminUser.admin).toBe(true);
			expect(adminUser.enabled).toBe(true);
		});

		it("should create first lambda user ", async () => {
			user = await userService.create({
				name: "user",
				password: "user12345",
				admin: false,
			});
			expect(user.name).toBe("user");
			expect(user.admin).toBe(false);
			expect(user.enabled).toBe(false);
		});
		it("should fail, as user with same name already exists", async () => {
			const test = () =>
				userService.create({
					name: "user",
					password: "user12345",
					admin: false,
				});
			expect(test()).rejects.toThrow(UserAlreadyExistsException);
		});
	});

	describe("Get user", () => {
		it("Should find user by id", async () => {
			const fetchedUser = await userService.get({ id: user.id });
			expect(fetchedUser).toStrictEqual(user);
		});
		it("Should find user by name", async () => {
			const fetchedUser = await userService.get({ name: adminUser.name });
			expect(fetchedUser).toStrictEqual(adminUser);
		});
		it("Should find user by credentials", async () => {
			const fetchedUser = await userService.get({
				byCredentials: { name: user.name, password: "user12345" },
			});
			expect(fetchedUser).toStrictEqual(user);
		});
		it("Should throw, as id is not used", () => {
			const test = () => userService.get({ id: -1 });
			expect(test()).rejects.toThrow(UserNotFoundFromIDException);
		});

		it("Should throw, as name is not used", () => {
			const test = () => userService.get({ name: "user1" });
			expect(test()).rejects.toThrow(UserNotFoundException);
		});
		it("Should throw, as password is incorrect", () => {
			const test = () =>
				userService.get({
					byCredentials: { name: user.name, password: "12345" },
				});
			expect(test()).rejects.toThrow(InvalidUserCredentialsException);
		});
	});

	describe("Get users", () => {
		it("Should get all users", async () => {
			const users = await userService.getMany({});
			expect(users.length).toBe(2);
			expect(users).toContainEqual(adminUser);
			expect(users).toContainEqual(user);
		});
		it("Should get all admins", async () => {
			const users = await userService.getMany({ admin: true });
			expect(users).toStrictEqual([adminUser]);
		});
		it("Should get all disabled users", async () => {
			const users = await userService.getMany({ enabled: false });
			expect(users).toStrictEqual([user]);
		});
		it("should shuffle user", async () => {
			const sort1 = await userService.getMany({}, { take: 10 }, {}, 123);
			const sort2 = await userService.getMany({}, { take: 10 }, {}, 1234);
			expect(sort1.length).toBe(sort2.length);
			expect(sort1).toContainEqual(adminUser);
			expect(sort1.map(({ id }) => id)).not.toBe(
				sort2.map(({ id }) => id),
			);
		});
	});

	describe("Update user", () => {
		it("Should set user as admin", async () => {
			const updatedUser = await userService.update(
				{ admin: true },
				{ id: user.id },
			);
			expect(updatedUser).toStrictEqual({ ...user, admin: true });
		});
		it("Should set admin as user", async () => {
			const updatedUser = await userService.update(
				{ admin: false },
				{ id: user.id },
			);
			expect(updatedUser).toStrictEqual(user);
		});
		it("Should enable user", async () => {
			const updatedUser = await userService.update(
				{ enabled: true },
				{ id: user.id },
			);
			expect(updatedUser).toStrictEqual({ ...user, enabled: true });
		});
	});
});
