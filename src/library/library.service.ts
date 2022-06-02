import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { FileService } from 'src/file/file.service';
import { File } from 'src/file/models/file.model';
import { MetadataService } from 'src/metadata/metadata.service';
import { Slug } from 'src/slug/slug';
import { LibraryAlreadyExistsException, LibraryNotFoundException } from './library.exceptions';
import { LibraryDto } from './models/library.dto';
import { Library } from './models/library.model';

@Injectable()
export class LibraryService {
	constructor(
		@InjectModel(Library)
		private libraryModel: typeof Library,
		private fileManagerService: FileManagerService,
		private fileService: FileService,
		private metadataService: MetadataService
	) {}
	
	async createLibrary(createLibraryDto: LibraryDto): Promise<Library> {
		let newLibrary = Library.build({...createLibraryDto});
		newLibrary.buildSlugIfNull();
		return await newLibrary.save().catch(() => {
			throw new LibraryAlreadyExistsException(new Slug(newLibrary.slug!));
		});
	}

	async getAllLibraries(withFiles = false) {
		return this.libraryModel.findAll({
			include: (withFiles ? [File] : []),
		});
	}

	/**
	 * Retrieves Library entry using slug
	 * @param slug the slug of the library to fetch
	 * @param withFiles bool, true if related files relations should be resolved
	 * @returns The fetched Library
	 */
	async getLibrary(slug: Slug, withFiles = false): Promise<Library> {
		return await this.libraryModel.findOne({
			include: (withFiles ? [File] : []),
			rejectOnEmpty: true,
			where: {
				slug: slug.toString(),
			}
		}).catch(() => {
			throw new LibraryNotFoundException(slug);
		});
	}

	/**
	 * Registers new files a Library
	 * @param parentLibrary The Library the files will be registered under
	 * @returns The array of newly registered Files
	 */
	async registerNewFiles(parentLibrary: Library): Promise<File[]> {
		Logger.log(`'${parentLibrary.slug}' library: Registration of new files`);
		let unfilteredCandidates = this.fileManagerService.getCandidateFilesInLibraryFolder(parentLibrary.path);
		let alreadyRegistrered = await this.fileService.findFilesFromPath(unfilteredCandidates);

		let candidates = unfilteredCandidates.filter(
			(candidatePath) => {
				return alreadyRegistrered.findIndex((registered) => registered.path == candidatePath) == -1;
			}
		);
		let newlyRegistered: File[] = [];

		candidates.forEach(
			async (candidate) => {
				newlyRegistered.push(await this.registerFile(candidate, parentLibrary));
			}
		);
		Logger.log(`${parentLibrary.slug} library: ${candidates.length} new files registered`);
		return newlyRegistered;
	}

	/**
	 * Registers a File in the database, parses and push its metadata 
	 * @param filePath the short path of the file to register (without base folder and library folder)
	 * @param parentLibrary the parent library to register the file under
	 * @returns a registered File entity
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		Logger.log(`${parentLibrary.slug} library: Registration of ${filePath}`);
		const fullFilePath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}/${filePath}`;
		const fileMetadata = await this.metadataService.parseMetadata(fullFilePath);
		let registeredFile = await this.fileService.registerFile(filePath, parentLibrary);
		try {
			await this.metadataService.registerMetadata(fileMetadata, registeredFile);
		} catch (e) {
			Logger.warn(e);
			await registeredFile.destroy();
			Logger.log(`${parentLibrary.slug} library: Registration of ${filePath} failed because of bad metadata.`);
		}
		return registeredFile
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param parentLibrary the library to clean, with resolved files relations
	 * @returns The array of deleted file entry
	 */
	async unregisterUnavailableFiles(parentLibrary: Library): Promise<File[]> {
		Logger.log(`'Cleaning ${parentLibrary.slug}' library`);
		const libraryPath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}`;
		let registeredFiles: File[] = parentLibrary.files;
		let unavailableFiles: File[] = registeredFiles.filter(
			(file) => this.fileManagerService.fileExists(`${libraryPath}/${file.path}`) == false
		);
		Logger.log(`'${parentLibrary.slug}' library: Removing ${unavailableFiles.length} entries`);
		this.fileService.removeFileEntries(...unavailableFiles);
		return unavailableFiles;
	}
}
