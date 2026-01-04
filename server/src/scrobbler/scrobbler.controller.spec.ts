import {
	HttpStatus,
	INestApplication,
	MiddlewareConsumer,
	Module,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TestingModule } from "@nestjs/testing";
import { Scrobbler } from "src/prisma/generated/client";
import { AppProviders, applyMiddlewares } from "src/app.plugins";
import AuthenticationModule from "src/authentication/authentication.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import UserModule from "src/user/user.module";
import request from "supertest";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { LastFMAuthUrlResponse } from "./models/lastfm.dto";
import ScrobblersResponse from "./models/scrobblers.response";
import ScrobblerModule from "./scrobbler.module";

@Module({
	imports: [
		AuthenticationModule,
		UserModule,
		FileManagerModule,
		PrismaModule,
		SettingsModule,
		ScrobblerModule,
	],
	providers: [PrismaService, ...AppProviders],
})
class TestModule {
	configure(consumer: MiddlewareConsumer) {
		applyMiddlewares(consumer);
	}
}

describe("Song Controller", () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let accessToken: string;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [TestModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();

		accessToken = module.get(JwtService).sign({
			name: dummyRepository.user1.name,
			id: dummyRepository.user1.id,
		});
	});

	afterAll(async () => {
		await app.close();
	});

	describe("Get Scrobbler status", () => {
		it("Should list all available scrobblers", () => {
			return request(app.getHttpServer())
				.get("/scrobblers")
				.auth(accessToken, { type: "bearer" })
				.expect((res) => {
					const response = res.body as ScrobblersResponse;
					expect(response.connected).toStrictEqual([]);
					expect(response.available).toStrictEqual([
						Scrobbler.LastFM,
						Scrobbler.ListenBrainz,
					]);
				});
		});
		it("Should list enabled scrobbler", async () => {
			await dummyRepository.userScrobbler.create({
				data: {
					userId: dummyRepository.user1.id,
					scrobbler: Scrobbler.LastFM,
					data: { sessionToken: "a" },
				},
			});
			await request(app.getHttpServer())
				.get("/scrobblers")
				.auth(accessToken, { type: "bearer" })
				.expect((res) => {
					const response = res.body as ScrobblersResponse;
					expect(response.available).toStrictEqual([
						Scrobbler.ListenBrainz,
					]);
					expect(response.connected).toStrictEqual([
						Scrobbler.LastFM,
					]);
				});
			await dummyRepository.userScrobbler.deleteMany({});
		});

		it("Should error: unauthenticated", () => {
			return request(app.getHttpServer())
				.get("/scrobblers")
				.expect(HttpStatus.UNAUTHORIZED);
		});
	});

	describe("LastFM", () => {
		describe("Get Authentication Url", () => {
			it("Should get Url", () => {
				return request(app.getHttpServer())
					.get("/scrobblers/lastfm/url?callback=localhost:3000")
					.auth(accessToken, { type: "bearer" })
					.expect((res) => {
						const response = res.body as LastFMAuthUrlResponse;
						expect(response.url).toStrictEqual(
							`https://www.last.fm/api/auth/?api_key=a&cb=${encodeURIComponent("localhost:3000")}`,
						);
					});
			});
			it("Should error: unauthenticated", () => {
				return request(app.getHttpServer())
					.get("/scrobblers/lastfm/url")
					.expect(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe("Disconnect Scrobbler", () => {
		it("Should disconnect Scrobbler", async () => {
			await dummyRepository.userScrobbler.create({
				data: {
					userId: dummyRepository.user1.id,
					scrobbler: Scrobbler.LastFM,
					data: { sessionToken: "a" },
				},
			});
			await request(app.getHttpServer())
				.delete("/scrobblers/lastfm")
				.auth(accessToken, { type: "bearer" });
			const enabledScrobblers = await dummyRepository.userScrobbler.count(
				{},
			);
			expect(enabledScrobblers).toBe(0);
		});

		it("Should no-op if scrobbler is not connected", () => {
			return request(app.getHttpServer())
				.delete("/scrobblers/listenbrainz")
				.auth(accessToken, { type: "bearer" })
				.expect(200);
		});
		it("Should error: unauthenticated", () => {
			return request(app.getHttpServer())
				.delete("/scrobblers/lastfm")
				.expect(HttpStatus.UNAUTHORIZED);
		});
	});
});
