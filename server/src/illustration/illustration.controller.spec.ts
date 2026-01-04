import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileModule from "src/file/file.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import GenreModule from "src/genre/genre.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";

// Import as a require to mock
const fs = require("node:fs");

import { createReadStream, existsSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IllustrationType } from "src/prisma/generated/client";
import { AppProviders } from "src/app.plugins";
import AuthenticationModule from "src/authentication/authentication.module";
import type { Illustration } from "src/prisma/models";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import UserModule from "src/user/user.module";
import request from "supertest";
import SetupApp from "test/setup-app";
import IllustrationService from "./illustration.service";
import type { IllustrationResponse } from "./models/illustration.response";

jest.setTimeout(60000);

describe("Illustration Controller", () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let fileManagerService: FileManagerService;
	let module: TestingModule;
	let accessToken: string;
	let accessToken2: string;
	let artistIllustration: Illustration;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				FileManagerModule,
				PrismaModule,
				FileModule,
				ParserModule,
				FileModule,
				ArtistModule,
				AlbumModule,
				SongModule,
				ReleaseModule,
				TrackModule,
				GenreModule,
				LyricsModule,
				AuthenticationModule,
				SettingsModule,
				UserModule,
			],

			providers: AppProviders,
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		fileManagerService = module.get<FileManagerService>(FileManagerService);
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
		const settingsService = module.get(SettingsService);
		jest.spyOn(
			SettingsService.prototype,
			"settingsValues",
			"get",
		).mockReturnValue({
			...settingsService.settingsValues,
			allowAnonymous: true,
		} as any);

		accessToken = module.get(JwtService).sign({
			name: dummyRepository.user1.name,
			id: dummyRepository.user1.id,
		});

		accessToken2 = module.get(JwtService).sign({
			name: dummyRepository.user2.name,
			id: dummyRepository.user2.id,
		});
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	const getDummyIllustrationStream = () =>
		fs.createReadStream("test/sequencer.ts");
	const dummyIllustrationBytes = fs.readFileSync("test/sequencer.ts");

	const illustrationUrlExample =
		"https://fastly.picsum.photos/id/855/200/200.jpg?hmac=l4U_O6zoVhjz9BqOito1u4k30FNJz3hLVYjvrdE59MU";

	const illustration2UrlExample =
		"https://fastly.picsum.photos/id/584/200/200.jpg?hmac=3Qi-TuGGtoLhS0BSlFSLhp1fwexJGdcQ0IWuRa-QXnM";

	describe("Stream Illustration", () => {
		it("should return the artist illustration", async () => {
			artistIllustration = await dummyRepository.illustration.create({
				data: {
					aspectRatio: 1,
					type: IllustrationType.Cover,
					artist: { connect: { id: dummyRepository.artistA.id } },
					blurhash: "",
					colors: [],
				},
			});
			jest.spyOn(fileManagerService, "fileExists").mockReturnValueOnce(
				true,
			);
			jest.spyOn(fs, "createReadStream").mockReturnValueOnce(
				getDummyIllustrationStream(),
			);
			return request(app.getHttpServer())
				.get(`/illustrations/${artistIllustration.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual(dummyIllustrationBytes);
				});
		});
		it("should return 404, when artist does not exist", () => {
			return request(app.getHttpServer())
				.get("/illustrations/-1")
				.expect(404);
		});
	});

	describe("Delete Illustration", () => {
		it("should delete the illustration", () => {
			return request(app.getHttpServer())
				.delete(`/illustrations/${artistIllustration.id}`)
				.auth(accessToken, { type: "bearer" })
				.expect(200)
				.expect(() => {
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${artistIllustration.id}/cover.jpg`,
						),
					).toBe(false);
				});
		});
		it("should return 404, when illustration does not exist", () => {
			return request(app.getHttpServer())
				.delete("/illustrations/-1")
				.auth(accessToken, { type: "bearer" })
				.expect(404);
		});
	});

	describe("Update Artist Illustration", () => {
		let firstIllustration: IllustrationResponse | null = null;
		it("should create the artist illustration", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					artistId: dummyRepository.artistB.id,
					url: illustrationUrlExample,
				})
				.expect(201)
				.expect((res) => {
					const illustration = res.body;
					firstIllustration = illustration;
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${illustration.id}/cover.jpg`,
						),
					).toBe(true);
				});
		});
		it("should update the artist illustration", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					artistId: dummyRepository.artistB.id,
					url: illustration2UrlExample,
				})
				.expect(201)
				.expect((res) => {
					const illustration = res.body;
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${illustration.id}/cover.jpg`,
						),
					).toBe(true);
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${
								firstIllustration!.id
							}/cover.jpg`,
						),
					).toBe(false);
				});
		});
		it("should return 404, when artist does not exist", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					artistId: -1,
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Update Release Illustration", () => {
		let firstIllustration: IllustrationResponse | null = null;
		it("should create the release illustration", async () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					releaseId: dummyRepository.releaseB1_1.id,
					url: illustrationUrlExample,
				})
				.expect(201)
				.expect((res) => {
					const illustration = res.body;
					firstIllustration = illustration;
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${illustration.id}/cover.jpg`,
						),
					).toBe(true);
				});
		});
		it("should update the release illustration", async () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					releaseId: dummyRepository.releaseB1_1.id,
					url: illustration2UrlExample,
				})
				.expect(201)
				.expect((res) => {
					const illustration = res.body;
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${illustration.id}/cover.jpg`,
						),
					).toBe(true);

					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${
								firstIllustration!.id
							}/cover.jpg`,
						),
					).toBe(false);
				});
		});
		it("should return 404, when release does not exist", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					releaseId: -1,
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Update Track Illustration", () => {
		it("should create the track illustration", async () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					trackId: dummyRepository.trackC1_1.id,
					url: illustrationUrlExample,
				})
				.expect(201)
				.expect((res) => {
					const illustration = res.body;
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${illustration.id}/cover.jpg`,
						),
					).toBe(true);
				});
		});
		it("should return 404, when track does not exist", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					trackId: -1,
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Update Playlist Illustration", () => {
		it("should create the Playlist illustration", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					playlistId: dummyRepository.playlist1.id,
					url: illustrationUrlExample,
				})
				.expect(201)
				.expect((res) => {
					const illustration = res.body;
					expect(
						fileManagerService.fileExists(
							`test/assets/metadata/${illustration.id}/cover.jpg`,
						),
					).toBe(true);
				});
		});

		it("should return 401, not the owner", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken2, { type: "bearer" })
				.send({
					playlistId: dummyRepository.playlist1.id,
					url: illustrationUrlExample,
				})
				.expect(401);
		});

		it("should return 401, microservices cannot update playlist cover", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.set("x-api-key", "a")
				.send({
					playlistId: dummyRepository.playlist1.id,
					url: illustrationUrlExample,
				})
				.expect(401);
		});
		it("should return 404, when playlist does not exist", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					playlistId: -1,
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("POST Illustration", () => {
		it("should not save the illustration (2 resource ids)", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					artistId: 1,
					releaseId: 2,
					url: illustrationUrlExample,
				})
				.expect(400);
		});
		it("should not save the illustration (no resource id)", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
				.auth(accessToken, { type: "bearer" })
				.send({
					url: illustrationUrlExample,
				})
				.expect(400);
		});
	});

	describe("Register Illustration", () => {
		const buildData = (r: request.Test, trackId: number) => {
			return r
				.field("type", "Thumbnail")
				.field("trackId", trackId)
				.attach("file", createReadStream("test/assets/cover2.jpg"));
		};
		describe("Error handling", () => {
			it("Should throw, as target track does not exist", async () => {
				return buildData(
					request(app.getHttpServer()).post("/illustrations/file"),
					1,
				)
					.auth(accessToken, { type: "bearer" })
					.expect(404);
			});
			it("Should throw, as target track is not a video", async () => {
				return buildData(
					request(app.getHttpServer()).post("/illustrations/file"),
					dummyRepository.trackA1_1.id,
				)
					.auth(accessToken, { type: "bearer" })
					.expect(400);
			});
			it("Should throw, as type is not valid", async () => {
				return buildData(
					request(app.getHttpServer()).post("/illustrations/file"),
					dummyRepository.trackC1_1.id,
				)
					.auth(accessToken, { type: "bearer" })
					.expect(400)
					.field("type", "Avatar");
			});
		});
		it("Should set the image's illustration", async () => {
			return buildData(
				request(app.getHttpServer()).post("/illustrations/file"),
				dummyRepository.trackA1_2Video.id,
			)
				.auth(accessToken, { type: "bearer" })
				.expect(201)
				.expect((res) => {
					const illustration: IllustrationResponse = res.body;
					const illustrationPath = `test/assets/metadata/${illustration.id}/cover.jpg`;
					expect(illustration.type).toBe("Thumbnail");
					expect(existsSync(illustrationPath)).toBe(true);
					rmSync(dirname(illustrationPath), {
						recursive: true,
						force: true,
					});
				});
		});
	});
});
