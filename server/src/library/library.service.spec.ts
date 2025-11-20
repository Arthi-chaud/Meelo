import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileModule from "src/file/file.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import { HousekeepingModule } from "src/housekeeping/housekeeping.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import type { Library } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { RegistrationModule } from "src/registration/registration.module";
import SettingsModule from "src/settings/settings.module";
import Slug from "src/slug/slug";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	LibraryAlreadyExistsException,
	LibraryNotFoundException,
} from "./library.exceptions";
import LibraryModule from "./library.module";
import LibraryService from "./library.service";

describe("Library Service", () => {
	let libraryService: LibraryService;
	let dummyRepository: TestPrismaService;
	let newLibrary: Library;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				LibraryModule,
				PrismaModule,
				FileModule,
				ParserModule,
				RegistrationModule,
				HousekeepingModule,
				FileManagerModule,
				IllustrationModule,
				TrackModule,
				LyricsModule,
				ArtistModule,
				SettingsModule,
			],
			providers: [LibraryService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		libraryService = module.get<LibraryService>(LibraryService);
		dummyRepository = module.get(PrismaService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(libraryService).toBeDefined();
	});

	describe("Create Library", () => {
		it("should create a new library", async () => {
			newLibrary = await libraryService.create({
				name: "My New Library",
				path: "here",
			});

			expect(newLibrary.id).toBeDefined();
			expect(newLibrary.name).toBe("My New Library");
			expect(newLibrary.path).toBe("here");
			expect(newLibrary.slug).toBe("my-new-library");
		});

		it("should throw as library already exists (name already used)", () => {
			const test = async () => {
				await libraryService.create({
					name: dummyRepository.library1.name,
					path: "Already here",
				});
			};
			return expect(test()).rejects.toThrow(
				LibraryAlreadyExistsException,
			);
		});

		it("should throw as library already exists (path already used)", async () => {
			const test = async () => {
				return await libraryService.create({
					name: "trolololol",
					path: dummyRepository.library1.path,
				});
			};
			return expect(test()).rejects.toThrow(
				LibraryAlreadyExistsException,
			);
		});
	});

	describe("Get Library", () => {
		it("should get the library (without files)", async () => {
			const library = await libraryService.get({
				slug: new Slug(dummyRepository.library1.slug),
			});

			expect(library).toStrictEqual(dummyRepository.library1);
		});

		it("should get the library (with files)", async () => {
			const library = await libraryService.get(
				{ slug: new Slug(dummyRepository.library1.slug) },
				{
					files: true,
				},
			);

			expect(library).toStrictEqual({
				...dummyRepository.library1,
				files: [
					dummyRepository.fileA1_1,
					dummyRepository.fileA1_2Video,
					dummyRepository.fileC1_1,
				],
			});
		});

		it("should throw, as the library does not exists", async () => {
			const test = async () => {
				await libraryService.get({ slug: new Slug("trolololol") });
			};
			return expect(test()).rejects.toThrow(LibraryNotFoundException);
		});
	});

	describe("Get All Libraries", () => {
		it("should get every libraries (without files)", async () => {
			const libraries = await libraryService.getMany({});

			expect(libraries.length).toBe(3);
			expect(libraries).toContainEqual(dummyRepository.library1);
			expect(libraries).toContainEqual(dummyRepository.library2);
			expect(libraries).toContainEqual(newLibrary);
		});

		it("should get every libraries, sorted by name", async () => {
			const libraries = await libraryService.getMany(
				{},
				{ sortBy: "name", order: "desc" },
				{},
			);

			expect(libraries.length).toBe(3);
			expect(libraries[0]).toStrictEqual(newLibrary);
			expect(libraries[1]).toStrictEqual(dummyRepository.library2);
			expect(libraries[2]).toStrictEqual(dummyRepository.library1);
		});

		it("should get some libraries (w/ pagination)", async () => {
			const libraries = await libraryService.getMany(
				{},
				{},
				{ take: 1, skip: 1 },
			);

			expect(libraries.length).toBe(1);
			expect(libraries[0]).toStrictEqual(dummyRepository.library2);
		});
	});

	describe("Delete Library", () => {
		it("should throw, as the library does not exists", async () => {
			return expect(async () =>
				libraryService.delete({ slug: new Slug("trolololol") }),
			).rejects.toThrow(LibraryNotFoundException);
		});
		it("should delete the library", async () => {
			await libraryService.delete({
				slug: new Slug(dummyRepository.library2.slug),
			});

			return expect(async () =>
				libraryService.get({ id: dummyRepository.library2.id }),
			).rejects.toThrow(LibraryNotFoundException);
		});
		it("should have deletes the related files", async () => {
			const filesCount = await dummyRepository.file.count({
				where: { libraryId: dummyRepository.library2.id },
			});
			expect(filesCount).toBe(0);
		});
		it("should have deletes the related tracks", async () => {
			const trackCount = await dummyRepository.track.count({
				where: {
					song: {
						artist: { id: dummyRepository.artistB.id },
					},
				},
			});
			expect(trackCount).toBe(0);
		});
	});
});
