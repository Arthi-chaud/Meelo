import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaService from "src/prisma/prisma.service";
import PrismaModule from "src/prisma/prisma.module";
import TestPrismaService from "test/test-prisma.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import ScannerModule from "src/scanner/scanner.module";
import AlbumModule from "src/album/album.module";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
// Import as a require to mock
const fs = require("fs");
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import SetupApp from "test/setup-app";
import ProvidersModule from "src/providers/providers.module";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import { IllustrationType } from "@prisma/client";
import { Illustration } from "src/prisma/models";
import { IllustrationResponse } from "./models/illustration.response";
import { createReadStream, existsSync, rmSync } from "fs";
import { dirname } from "path";

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
				ScannerModule,
				FileModule,
				ArtistModule,
				AlbumModule,
				SongModule,
				ReleaseModule,
				TrackModule,
				GenreModule,
				LyricsModule,
				ProvidersModule,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		fileManagerService = module.get<FileManagerService>(FileManagerService);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});
	const baseMetadataFolder = "test/assets/metadata";

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	const getDummyIllustrationStream = () =>
		fs.createReadStream("test/assets/settings.json");
	const dummyIllustrationBytes = fs.readFileSync("test/assets/settings.json");

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
				.get(`/illustrations/-1`)
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
				.delete(`/illustrations/-1`)
				.expect(404);
		});
	});

	describe("Update Artist Illustration", () => {
		let firstIllustration: IllustrationResponse | null = null;
		it("should create the artist illustration", () => {
			return request(app.getHttpServer())
				.post(`/artists/${dummyRepository.artistB.id}/illustration`)
				.send({
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
				.post(`/artists/${dummyRepository.artistB.id}/illustration`)
				.send({
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
				.post(`/artists/-1/artists`)
				.send({
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Update Release Illustration", () => {
		let firstIllustration: IllustrationResponse | null = null;
		it("should create the release illustration", async () => {
			return request(app.getHttpServer())
				.post(
					`/releases/${dummyRepository.releaseB1_1.id}/illustration`,
				)
				.send({
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
				.post(
					`/releases/${dummyRepository.releaseB1_1.id}/illustration`,
				)
				.send({
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
				.post(`/releases/-1/illustration`)
				.send({
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Update Track Illustration", () => {
		it("should create the track illustration", async () => {
			return request(app.getHttpServer())
				.post(`/tracks/${dummyRepository.trackC1_1.id}/illustration`)
				.send({
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
				.post(`/tracks/-1/illustration`)
				.send({
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Update Playlist Illustration", () => {
		it("should create the Playlist illustration", () => {
			return request(app.getHttpServer())
				.post(`/playlists/${dummyRepository.playlist1.id}/illustration`)
				.send({
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
				.post(`/playlists/-1/illustration`)
				.send({
					url: illustrationUrlExample,
				})
				.expect(404);
		});
	});

	describe("Register Illustration", () => {
		const buildData = (r: request.Test) => {
			return r
				.field("trackId", dummyRepository.trackC1_1.id)
				.field("type", "Thumbnail")
				.attach("file", createReadStream("test/assets/cover2.jpg"));
		};
		describe("Error handling", () => {
			it("Should throw, as target track does not exist", async () => {
				return buildData(
					request(app.getHttpServer()).post(`/illustrations`),
				)
					.expect(400)
					.field("trackId", 1);
			});
			it("Should throw, as type is not valid", async () => {
				return buildData(
					request(app.getHttpServer()).post(`/illustrations`),
				)
					.expect(400)
					.field("type", "Avatar");
			});
		});
		it("Should set the image's illustration", async () => {
			return buildData(
				request(app.getHttpServer()).post(`/illustrations`),
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
