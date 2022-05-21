import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { File } from './models/file.model';
import * as fs from 'fs';
import { constants } from 'buffer';
import { SettingsService } from 'src/settings/settings.service';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { Library } from 'src/library/models/library.model';

@Injectable()
export class FileService {
	constructor(
		@InjectModel(File)
		private fileModel: typeof File,
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService
	) {}

	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, excluding base dataFolder & parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	registerFile(filePath: string, parentLibrary: Library) {
		const baseDatafolder = this.settingsService.getDataFolder();
		const libraryPath = `${baseDatafolder}/${parentLibrary.path}`;
		const fullFilePath = `${libraryPath}/${filePath}`;
		fs.access(fullFilePath, fs.constants.R_OK, () => {
			throw new NotFoundException(`${fullFilePath}: File not accessible`)
		});
		
		let newFile: File = new File();
		newFile.path = filePath;
		newFile.registerDate = new Date();
		newFile.md5Checksum = this.fileManagerService.getMd5Checksum(fullFilePath);
		newFile.library = parentLibrary;
		newFile.save();
	}
}
