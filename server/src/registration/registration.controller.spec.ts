import { INestApplication } from "@nestjs/common";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import LibraryModule from "../library/library.module";
import TestPrismaService from "test/test-prisma.service";
import SetupApp from "test/setup-app";
import { RegistrationModule } from "./registration.module";
import { MetadataController } from "./registration.controller";
import MetadataDto from "./models/metadata.dto";
import request from "supertest";
import MetadataSavedResponse from "./models/metadata-saved.dto";
import FileService from "src/file/file.service";
import SongService from "src/song/song.service";
import SongModule from "src/song/song.module";
import ArtistModule from "src/artist/artist.module";
import ReleaseModule from "src/release/release.module";
import TrackModule from "src/track/track.module";
import PlaylistModule from "src/playlist/playlist.module";
import SettingsModule from "src/settings/settings.module";
import { File, Song } from "@prisma/client";

const validMetadata: MetadataDto = {
	path: "test/assets/Music/...Baby One More Time.m4a",
	checksum: "azerty",
	registrationDate: new Date("2012-04-03"),
	compilation: false,
	artist: "A",
	featuring: ["C"],
	album: "Album",
	release: "Album (Deluxe Edition)",
	name: "...Baby One More Time (feat. B)",
	type: "Audio",
	genres: ["My Genre"],
	fingerprint: "AcoustId",
};

const applyFormFields = (r: request.Test, object: MetadataDto) => {
	Object.entries(object).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			(value as any[]).forEach((arrayValue, index) => {
				r.field(`${key}[${index}]`, arrayValue);
			});
		} else {
			r.field(key, value.toString());
		}
	});
	return r;
};

describe("Registration Controller", () => {
	let app: INestApplication;
	let fileService: FileService;
	let songService: SongService;
	let dummyRepository: TestPrismaService;
	let createdFile: File;
	let createdSong: Song;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				LibraryModule,
				FileManagerModule,
				PrismaModule,
				FileModule,
				ParserModule,
				RegistrationModule,
				SongModule,
				ArtistModule,
				ReleaseModule,
				TrackModule,
				PlaylistModule,
				SettingsModule,
			],
			controllers: [MetadataController],
			providers: [PrismaService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		fileService = module.get(FileService);
		songService = module.get(SongService);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});
	describe("Metadata Registration", () => {
		describe("Error Handling", () => {
			describe("Path", () => {
				it("should fail, path contains '..'", () => {
					return applyFormFields(
						request(app.getHttpServer()).post(`/metadata`),
						{
							...validMetadata,
							path: "test/assets/Music 2/../...Baby One More Time.m4a",
						},
					)
						.expect(400)
						.expect(({ body }) =>
							expect(
								body.message.includes("not absolute"),
							).toBeTruthy(),
						);
				});
				it("should fail, path not in DATA_DIR", () => {
					return applyFormFields(
						request(app.getHttpServer()).post(`/metadata`),
						{
							...validMetadata,
							path: "/videos/Music/...Baby One More Time.m4a",
						},
					)
						.expect(400)
						.expect(({ body }) => {
							expect(
								body.message.includes(
									"not in an allowed folder",
								),
							).toBeTruthy();
						});
				});
				it("should fail, path not in a known library", () => {
					return applyFormFields(
						request(app.getHttpServer()).post(`/metadata`),
						{
							...validMetadata,
							path: "test/assets/Music 3/...Baby One More Time.m4a",
						},
					)
						.expect(404)
						.expect(({ body }) => {
							expect(
								body.message.includes(
									"Libraty could not be found using path",
								),
							).toBeTruthy();
						});
				});
			});
		});

		it("Should register metadata", async () => {
			const res = await applyFormFields(
				request(app.getHttpServer()).post(`/metadata`),
				validMetadata,
			).expect(201);
			const createdMetadata: MetadataSavedResponse = res.body;
			expect(createdMetadata.trackId).toBeGreaterThan(0);
			expect(createdMetadata.libraryId).toBeGreaterThan(0);
			expect(createdMetadata.songId).toBeGreaterThan(0);
			expect(createdMetadata.sourceFileId).toBeGreaterThan(0);
			expect(createdMetadata.releaseId).toBeGreaterThan(0);
			const file = await fileService.get(
				{ id: createdMetadata.sourceFileId },
				{ track: true },
			);
			expect(file.id).toBe(createdMetadata.sourceFileId);
			expect(file.checksum).toBe(validMetadata.checksum);
			expect(file.libraryId).toBe(createdMetadata.libraryId);
			expect(file.track!.id).toBe(createdMetadata.trackId);
			expect(file.path).toBe("...Baby One More Time.m4a");
			expect(file.fingerprint).toBe("AcoustId");

			const song = await songService.get(
				{ id: createdMetadata.songId },
				{
					artist: true,
					featuring: true,
					master: true,
					illustration: true,
				},
			);
			expect(song.name).toBe("...Baby One More Time");
			expect(song.artist.name).toBe(validMetadata.artist);
			expect(song.featuring.length).toBe(2);
			expect(song.featuring[0].name).toBe("B");
			expect(song.featuring[1].name).toBe(validMetadata.featuring![0]);
			expect(song.registeredAt).toStrictEqual(
				validMetadata.registrationDate,
			);
			expect(song.masterId).toBe(file.track!.id);
			createdFile = file;
			createdSong = song;
		});
	});
	describe("Metadata Update", () => {
		it("Should update metadata", async () => {
			const res = await applyFormFields(
				request(app.getHttpServer()).put(`/metadata`),
				{
					...validMetadata,
					checksum: "zzz",
					registrationDate: new Date("2011-04-03"),
				},
			).expect(200);
			const createdMetadata: MetadataSavedResponse = res.body;
			expect(createdMetadata.trackId).toBeGreaterThan(
				createdSong.masterId!,
			);
			expect(createdMetadata.songId).toEqual(createdSong.id);
			expect(createdMetadata.sourceFileId).toEqual(createdFile.id);
			const file = await fileService.get(
				{ id: createdMetadata.sourceFileId },
				{ track: true },
			);
			expect(file.id).toBe(createdMetadata.sourceFileId);
			expect(file.checksum).toBe("zzz");
			expect(file.registerDate).toStrictEqual(new Date("2011-04-03"));
			expect(file.track!.id).toBe(createdMetadata.trackId);
			expect(file.path).toBe("...Baby One More Time.m4a");
		});
	});
});
