import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { FileService } from 'src/file/file.service';
import { File } from 'src/file/models/file.model';
import { LibraryDto } from './models/library.dto';
import { Library } from './models/library.model';

@Injectable()
export class LibraryService {
	constructor(
		@InjectModel(Library)
		private libraryModel: typeof Library,
		private fileManagerService: FileManagerService,
		private fileService: FileService
	) {}
	
	async createLibrary(createLibraryDto: LibraryDto): Promise<Library> {
		return await this.libraryModel.create({...createLibraryDto});
	}

	async getAllLibraries(withFiles = false) {
		return this.libraryModel.findAll({
			include: (withFiles ? [File] : []),
		});
	}

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
}
