import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import md5File from 'md5-file';
import * as fs from 'fs';

@Injectable()
export class FileManagerService {
	constructor(private settingsService: SettingsService) {}

	/**
	 * Compute the MD5 checksum of a file
	 * @param filePath The Path to a file, whose MD5 checksum will be computed
	 * @returns the MD5 Checksum as a string
	 */
	getMd5Checksum(filePath: string) {
		return md5File.sync(filePath);
	}

	/**
	 * Get any file that matches the RegExps from the settings, in a Library's base folder
	 * @param libraryBaseDirectory The path to the library, without settings's dataFolder
	 * @returns A List of strings representing the path of candidate file, without dataFolder and libraryBaseDirectory
	 */
	getCandidateFilesInLibraryFolder(libraryBaseDirectory: string): string[] {
		const baseFolder = this.settingsService.getDataFolder();
		const libraryPath = `${baseFolder}/${libraryBaseDirectory}`;
		return this.getCandidateInFolder(libraryPath).map(
			(candidateFullPath) => candidateFullPath.substring(0, libraryPath.length)
		);
	}

	/**
	 * Get all file matching RegExp from Settings service, recursively in a folder
	 * @param folderPath The path of a folder to go through
	 */
	private getCandidateInFolder(folderPath: string): string[] {
		let directoryContent = fs.readdirSync(folderPath, { withFileTypes: true });
		let candidates = [];

		directoryContent.forEach(
			(dirEntry) => {
				const entryFullPath = `${folderPath}/${dirEntry.name}`;
				if (dirEntry.isDirectory)
					candidates.concat(this.getCandidateInFolder(entryFullPath));
				else if (dirEntry.isFile) {
					let matchingRegexes = this.settingsService.getTrackRegexes().filter(
						(regex) => entryFullPath.match(regex) != null
					);
					if (matchingRegexes.length > 0)
						candidates.push(entryFullPath);
				}
			}
		);
		return candidates;
	}
}
