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
		@InjectModel(File)
		private fileModel: typeof File,
		private fileManagerService: FileManagerService,
		private fileService: FileService
	) {}
	async createLibrary(createLibraryDto: LibraryDto) {
		let newLibrary: Library = new Library();
		newLibrary.path = createLibraryDto.path;
		newLibrary.name = createLibraryDto.name;
		newLibrary.save();
	}

	async getAllLibraries() {
		return this.libraryModel.findAll();
	}

	async getLibrary(name: string) {
		return this.libraryModel.findOne({
			where: {
				name: name,
			}
		});
	}

	async registerNewFiles(parentLibrary: Library) {
		let unfilteredCandidates = this.fileManagerService.getCandidateFilesInLibraryFolder(parentLibrary.path);
		let alreadyRegistrered = await this.fileModel.findAll({
			where: Sequelize.or(
				{ path: unfilteredCandidates },
			)
		});
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
