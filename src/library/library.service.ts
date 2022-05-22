import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { FileService } from 'src/file/file.service';
import { File } from 'src/file/models/file.model';
import { SettingsService } from 'src/settings/settings.service';
import { LibraryDto } from './models/library.dto';
import { Library } from './models/library.model';

@Injectable()
export class LibraryService {
	constructor(
		@InjectModel(Library)
		private libraryModel: typeof Library,
		private fileManagerService: FileManagerService,
		private fileService: FileService,
		private settingService: SettingsService
	) {}
	
	async createLibrary(createLibraryDto: LibraryDto): Promise<Library> {
		return await this.libraryModel.create({...createLibraryDto});
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
	async getLibrary(slug: string, withFiles = false): Promise<Library> {
		return await this.libraryModel.findOne({
			include: (withFiles ? [File] : []),
			rejectOnEmpty: true,
			where: {
				slug: slug,
			}
		});
	}

	/**
	 * Registers new files a Library
	 * @param parentLibrary The Library the files will be registered under
	 * @returns The array of newly registered Files
	 */
	async registerNewFiles(parentLibrary: Library): Promise<File[]> {
		Logger.log(`Registration of new files from '${parentLibrary.slug}' library`);
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
				Logger.log(`${parentLibrary.slug} library: Registration of ${candidate}`);
				newlyRegistered.push(await this.fileService.registerFile(candidate, parentLibrary));
			}
		);
		Logger.log(`${parentLibrary.slug} library: ${candidates.length} new files registered`);
		return newlyRegistered;
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param parentLibrary the library to clean, with resolved files relations
	 * @returns The array of deleted file entry
	 */
	async unregisterUnavailableFiles(parentLibrary: Library): Promise<File[]> {
		Logger.log(`Cleaning '${parentLibrary.slug}' library`);
		const libraryPath = `${this.settingService.getDataFolder()}/${parentLibrary.path}`;
		let registeredFiles: File[] = parentLibrary.files;
		let unavailableFiles: File[] = registeredFiles.filter(
			(file) => this.fileManagerService.fileExists(`${libraryPath}/${file.path}`) == false
		);
		Logger.log(`'${parentLibrary.slug}' library: Removing ${unavailableFiles.length} entries`);
		this.fileService.removeFileEntries(...unavailableFiles);
		return unavailableFiles;
	}
}
