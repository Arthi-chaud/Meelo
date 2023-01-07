import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import SettingsService from 'src/settings/settings.service';
import md5File from 'md5-file';
import * as fs from 'fs';
import type { Library } from 'src/prisma/models';
import { FileDoesNotExistException, FolderDoesNotExistException } from './file-manager.exceptions';
import { join } from 'path';

@Injectable()
export default class FileManagerService {
	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsService: SettingsService
	) {}

	folderExists(folderPath: string): boolean {
		try {
			return fs.lstatSync(folderPath).isDirectory();
		} catch {
			return false;
		}
	}

	fileExists(filePath: string): boolean {
		return fs.existsSync(filePath);
	}

	fileIsReadable(filePath: string): boolean {
		try {
			fs.accessSync(filePath, fs.constants.R_OK);
			return true;
		} catch {
			return false;
		}
	}

	getFileContent(filePath: string): string {
		return fs.readFileSync(filePath, 'utf8');
	}

	getFileStat(filePath: string) {
		return fs.promises.stat(filePath);
	}

	async getFileBuffer(filePath: string): Promise<Buffer> {
		return fs.promises.readFile(filePath)
			.then((content) => Buffer.from(content));
	}

	/**
	 * Compute the MD5 checksum of a file
	 * @param filePath The Full Path to a file, whose MD5 checksum will be computed
	 * @returns the MD5 Checksum as a string
	 */
	async getMd5Checksum(filePath: string): Promise<string> {
		return md5File(filePath);
	}

	/**
	 * Delete a file
	 */
	deleteFile(filePath: string) {
		if (this.fileExists(filePath)) {
			fs.unlinkSync(filePath);
		} else {
			throw new FileDoesNotExistException(filePath);
		}
	}

	/**
	 * Delete a directory
	 */
	deleteFolder(directoryPath: string) {
		if (this.folderExists(directoryPath)) {
			fs.rm(directoryPath, { recursive: true }, () => {});
		} else {
			throw new FolderDoesNotExistException(directoryPath);
		}
	}

	/**
	 * @returns Library's full path
	 */
	getLibraryFullPath(library: Library):string {
		return `${this.settingsService.settingsValues.dataFolder}/${library.path}`;
	}

	/**
	 * Get all directories in a folder
	 * @param folderPath The path of a folder to go through
	 */
	getDirectoriesInFolder(folderPath: string): string[] {
		try {
			const directoryContent = fs.readdirSync(folderPath, { withFileTypes: true });

			return directoryContent.filter((entry) => entry.isDirectory())
				.map((entry) => join(folderPath, entry.name));
		} catch {
			throw new FolderDoesNotExistException(folderPath);
		}
	}

	/**
	 * Get all files in a folder
	 * @param folderPath The path of a folder to go through
	 */
	getFilesInFolder(folderPath: string, recursive = false): string[] {
		try {
			const directoryContent = fs.readdirSync(folderPath, { withFileTypes: true });
			const files = directoryContent
				.filter((entry) => entry.isFile())
				.map((entry) => join(folderPath, entry.name));

			if (recursive) {
				const directories = this.getDirectoriesInFolder(folderPath);

				files.push(...directories
					.map((directory) => this.getFilesInFolder(directory, true))
					.flat());
			}
			return files;
		} catch {
			throw new FolderDoesNotExistException(folderPath);
		}
	}
}
