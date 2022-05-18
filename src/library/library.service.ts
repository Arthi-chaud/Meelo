import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { where } from 'sequelize/types';
import { LibraryDto } from './models/library.dto';
import { Library } from './models/library.model';

@Injectable()
export class LibraryService {
	constructor(
		@InjectModel(Library)
		private libraryModel: typeof Library,
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
}
