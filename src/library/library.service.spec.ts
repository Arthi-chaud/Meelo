import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { LibraryAlreadyExistsException, LibraryNotFoundException, LibraryNotFoundFromIDException } from "./library.exceptions";
import LibraryService from "./library.service";
import LibraryModule from "./library.module";
import PrismaModule from "src/prisma/prisma.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileModule from "src/file/file.module";
import MetadataModule from "src/metadata/metadata.module";
import IllustrationModule from "src/illustration/illustration.module";
import TrackModule from "src/track/track.module";
import TestPrismaService from "test/test-prisma.service";
import type { Library } from "@prisma/client";
import FileService from "src/file/file.service";
import TrackService from "src/track/track.service";
describe('Library Service', () => {
	let libraryService: LibraryService;
	let fileService: FileService;
	let trackService: TrackService;
	let dummyRepository: TestPrismaService;
	let newLibrary: Library;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule, TrackModule],
			providers: [LibraryService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		libraryService = module.get<LibraryService>(LibraryService);
		fileService = module.get(FileService);
		trackService = module.get(TrackService);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	it('should be defined', () => {
		expect(libraryService).toBeDefined();
	});


	describe('Create Library', () => {
		it('should create a new library', async () => {
			newLibrary = await libraryService.create({
				name: 'My New Library',
				path: 'here'
			});

			expect(newLibrary.id).toBeDefined();
			expect(newLibrary.name).toBe('My New Library');
			expect(newLibrary.path).toBe('here');
			expect(newLibrary.slug).toBe('my-new-library');
		});

		it(('should throw as library already exists (name already used)'), () => {
			const test = async () => {
				await libraryService.create({
					name: dummyRepository.library1.name,
					path: 'Already here'
				});
			};
			expect(test()).rejects.toThrow(LibraryAlreadyExistsException);
		});

		it(('should throw as library already exists (path already used)'), async () => {
			const test = async () => {
				return await libraryService.create({
					name: 'trolololol',
					path: dummyRepository.library1.path
				});
			};
			expect(test()).rejects.toThrow(LibraryAlreadyExistsException);
		});
	});

	describe('Get Library', () => { 
		it('should get the library (without files)', async () => {
			let library = await libraryService.get({ slug: new Slug(dummyRepository.library1.slug) });

			expect(library).toStrictEqual(dummyRepository.library1);
		});

		it('should get the library (with files)', async () => {
			let library = await libraryService.get({ slug: new Slug(dummyRepository.library1.slug) }, {
				files: true
			});

			expect(library).toStrictEqual({
				...dummyRepository.library1,
				files: [
					dummyRepository.fileA1_1,
					dummyRepository.fileA1_2Video,
					dummyRepository.fileA2_1,
					dummyRepository.fileC1_1,
				]
			});
		});

		it('should throw, as the library does not exists', async () => {
			const test = async () => {
				await libraryService.get({ slug: new Slug('trolololol') });
			};
			expect(test()).rejects.toThrow(LibraryNotFoundException);
		});
	});

	describe('Get All Libraries', () => { 
		it('should get every libraries (without files)', async () => {
			let libraries = await libraryService.getMany({});

			expect(libraries.length).toBe(3);
			expect(libraries).toContainEqual(dummyRepository.library1);
			expect(libraries).toContainEqual(dummyRepository.library2);
			expect(libraries).toContainEqual(newLibrary);
		});

		it('should get every libraries, sorted by name', async () => {
			let libraries = await libraryService.getMany({}, {}, {}, { sortBy: 'name', order: 'desc' });

			expect(libraries.length).toBe(3);
			expect(libraries[0]).toStrictEqual(newLibrary);
			expect(libraries[1]).toStrictEqual(dummyRepository.library2);
			expect(libraries[2]).toStrictEqual(dummyRepository.library1);
		});

		it('should get some libraries (w/ pagination)', async () => {
			let libraries = await libraryService.getMany({}, { take: 1, skip: 1 });

			expect(libraries.length).toBe(1);
			expect(libraries[0]).toStrictEqual(dummyRepository.library2);
		});

		it('should get every libraries (with files)', async () => {
			let libraries = await libraryService.getMany({}, {}, {
				files: true
			});

			expect(libraries.length).toBe(3);
			expect(libraries).toContainEqual({
				...dummyRepository.library1,
				files: [
					dummyRepository.fileA1_1,
					dummyRepository.fileA1_2Video,
					dummyRepository.fileA2_1,
					dummyRepository.fileC1_1,
				]
			});
			expect(libraries).toContainEqual({
				...newLibrary,
				files: []
			})
			expect(libraries).toContainEqual({
				...dummyRepository.library2,
				files: [
					dummyRepository.fileB1_1
				]
			})
		});
	});

	describe('Delete Library', () => {
		it('should throw, as the library does not exists', async () => {
			expect(
				async () => libraryService.delete({ slug: new Slug('trolololol') })
			).rejects.toThrow(LibraryNotFoundException);
		});
		it('should delete the library', async () => {
			await libraryService.delete({ slug: new Slug(dummyRepository.library2.slug) });

			expect(
				async () => libraryService.get({ id: dummyRepository.library2.id })
			).rejects.toThrow(LibraryNotFoundFromIDException);
		});
		it('should have deletes the related files', async () => {
			let filesCount = await fileService.count({ library: { id: dummyRepository.library2.id } });
			expect(filesCount).toBe(0);
		});
		it('should have deletes the related tracks', async () => {
			let trackCount = await trackService.countTracks({ byArtist: { id: dummyRepository.artistB.id }});
			expect(trackCount).toBe(0);
		});

	});
})