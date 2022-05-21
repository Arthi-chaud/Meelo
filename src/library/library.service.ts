import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { where } from 'sequelize/types';
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
		let newLibrary: Library = new Library();
		newLibrary.path = createLibraryDto.path;
		newLibrary.name = createLibraryDto.name;
		await newLibrary.save();
		return newLibrary;
	}

	async getAllLibraries(withFiles = false) {
		return this.libraryModel.findAll({
			include: (withFiles ? [File] : []),
		});
	}

	async getLibrary(slug: string, withFiles = false) {
		return this.libraryModel.findOne({
			include: (withFiles ? [File] : []),
			where: {
				slug: slug,
			}
		});
	}

	async registerNewFiles(parentLibrary: Library) {
		let unfilteredCandidates = this.fileManagerService.getCandidateFilesInLibraryFolder(parentLibrary.path);
		let alreadyRegistrered = await this.fileService.findFilesFromPath(unfilteredCandidates);

		let candidates = unfilteredCandidates.filter(
			(candidatePath) => {
				alreadyRegistrered.findIndex((registered) => registered.path == candidatePath) == -1;
			}
		);
		candidates.forEach(
			(candidate) => this.fileService.registerFile(candidate, parentLibrary)
		);
	}
}
