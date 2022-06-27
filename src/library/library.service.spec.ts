import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { FileManagerModule } from "src/file-manager/file-manager.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { FileModule } from "src/file/file.module";
import { IllustrationModule } from "src/illustration/illustration.module";
import { MetadataModule } from "src/metadata/metadata.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { Slug } from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { LibraryAlreadyExistsException, LibraryNotFoundException } from "./library.exceptions";
import { LibraryModule } from "./library.module";
import { LibraryService } from "./library.service";

describe('Library Service', () => {
	let libraryService: LibraryService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LibraryModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, IllustrationModule],
			providers: [LibraryService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		libraryService = module.get<LibraryService>(LibraryService);
	});

	it('should be defined', () => {
		expect(libraryService).toBeDefined();
	});

	const libraryName = 'My Library'
	const librarySlug = new Slug(libraryName);

	describe('Create Library', () => {
		it('should create a new library', async () => {
			let newLibrary = await libraryService.createLibrary({
				name: libraryName,
				path: 'here'
			});

			expect(newLibrary.id).toBeDefined();
			expect(newLibrary.name).toBe(libraryName);
			expect(newLibrary.path).toBe('here');
			expect(newLibrary.slug).toBe(librarySlug.toString());
		});

		it(('should throw as library already exists (name already used)'), () => {
			const test = async () => {
				await libraryService.createLibrary({
					name: libraryName,
					path: 'Already here'
				});
			};
			expect(test()).rejects.toThrow(LibraryAlreadyExistsException);
		});

		it(('should throw as library already exists (path already used)'), async () => {
			const test = async () => {
				await libraryService.createLibrary({
					name: 'trolololol',
					path: 'here'
				});
			};
			expect(test()).rejects.toThrow(LibraryAlreadyExistsException);
		});
	});

	describe('Get Library', () => { 
		it('should get the library (without files)', async () => {
			let library = await libraryService.getLibrary({ slug: librarySlug });

			expect(library.id).toBeDefined();
			expect(library.name).toBe(libraryName);
			expect(library.path).toBe('here');
			expect(library.slug).toBe(librarySlug.toString());
			expect(library.files).toBeUndefined();
		});

		it('should get the library (with files)', async () => {
			let library = await libraryService.getLibrary({ slug: librarySlug }, {
				files: true
			});

			expect(library.id).toBeDefined();
			expect(library.name).toBe(libraryName);
			expect(library.path).toBe('here');
			expect(library.slug).toBe(librarySlug.toString());
			expect(library.files).toStrictEqual([]);
		});

		it('should throw, as the library does not exists', async () => {
			const test = async () => {
				await libraryService.getLibrary({ slug: new Slug('trolololol') });
			};
			expect(test()).rejects.toThrow(LibraryNotFoundException);
		});
	});

	describe('Get All Libraries', () => { 
		it('should get every libraries (without files)', async () => {
			let libraries = await libraryService.getLibraries({});

			expect(libraries.length).toBe(1);
			let library = libraries[0];
			expect(library.id).toBeDefined();
			expect(library.name).toBe(libraryName);
			expect(library.path).toBe('here');
			expect(library.slug).toBe(librarySlug.toString());
			expect(library.files).toBeUndefined();
		});

		it('should get every libraries (with files)', async () => {
			let libraries = await libraryService.getLibraries({}, {
				files: true
			});

			expect(libraries.length).toBe(1);
			let library = libraries[0];
			expect(library.id).toBeDefined();
			expect(library.name).toBe(libraryName);
			expect(library.path).toBe('here');
			expect(library.slug).toBe(librarySlug.toString());
			expect(library.files).toStrictEqual([]);
		});
	});

	describe('Delete Library', () => {
		it('should throw, as the library does not exists', async () => {
			expect(
				async () => await libraryService.deleteLibrary({ slug: new Slug('trolololol') })
			).rejects.toThrow(LibraryNotFoundException);
		});
		it('should delete the library', async () => {
			await libraryService.deleteLibrary({ slug: librarySlug });

			expect(
				async () => await libraryService.getLibrary({ slug: librarySlug })
			).rejects.toThrow(LibraryNotFoundException);
		});
	});
})