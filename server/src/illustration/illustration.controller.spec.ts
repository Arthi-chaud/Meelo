import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import FileModule from "src/file/file.module";
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
// biome-ignore lint/nursery/noRestrictedImports: Test
const fs = require("node:fs");
// biome-ignore lint/nursery/noRestrictedImports: Test
import { createReadStream, existsSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { IllustrationType } from "@prisma/client";
import type { Illustration } from "src/prisma/models";
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
			],
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
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	const getDummyIllustrationStream = () =>
		fs.createReadStream("test/sequencer.ts");
	const dummyIllustrationBytes = fs.readFileSync("test/sequencer.ts");

	const illustrationUrlExample =
		"https://sample-videos.com/img/Sample-jpg-image-50kb.jpg";

	const illustration2UrlExample =
		"https://sample-videos.com/img/Sample-jpg-image-100kb.jpg";

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
				.expect(404);
		});
	});

	describe("Update Artist Illustration", () => {
		let firstIllustration: IllustrationResponse | null = null;
		it("should create the artist illustration", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
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
		it("should return 404, when playlist does not exist", () => {
			return request(app.getHttpServer())
				.post("/illustrations/url")
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
				).expect(404);
			});
			it("Should throw, as target track is not a video", async () => {
				return buildData(
					request(app.getHttpServer()).post("/illustrations/file"),
					dummyRepository.trackA1_1.id,
				).expect(400);
			});
			it("Should throw, as type is not valid", async () => {
				return buildData(
					request(app.getHttpServer()).post("/illustrations/file"),
					dummyRepository.trackC1_1.id,
				)
					.expect(400)
					.field("type", "Avatar");
			});
		});
		it("Should set the image's illustration", async () => {
			return buildData(
				request(app.getHttpServer()).post("/illustrations/file"),
				dummyRepository.trackA1_2Video.id,
			)
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
