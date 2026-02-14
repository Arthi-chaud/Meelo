/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as fs from "node:fs";
import { join, parse } from "node:path";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import type { Library } from "src/prisma/models";
import SettingsService from "src/settings/settings.service";
import {
	FileDoesNotExistException,
	FolderDoesNotExistException,
} from "./file-manager.exceptions";

@Injectable()
export default class FileManagerService {
	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsService: SettingsService,
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
		return fs.readFileSync(filePath, "utf8");
	}

	getFileStat(filePath: string) {
		return fs.promises.stat(filePath);
	}

	async getFileBuffer(filePath: string): Promise<Buffer> {
		return fs.promises
			.readFile(filePath)
			.then((content) => Buffer.from(content.buffer));
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
			fs.rmSync(directoryPath, { recursive: true });
		} else {
			throw new FolderDoesNotExistException(directoryPath);
		}
	}

	/**
	 * Rename / Move a folder
	 */
	rename(oldPath: string, newPath: string) {
		fs.mkdirSync(parse(newPath).dir, { recursive: true });
		fs.renameSync(oldPath, newPath);
	}

	/**
	 * @returns Library's full path
	 */
	getLibraryFullPath(library: Library): string {
		return `${this.settingsService.settingsValues.dataFolder}/${library.path}`;
	}

	/**
	 * Get all directories in a folder
	 * @param folderPath The path of a folder to go through
	 */
	getDirectoriesInFolder(folderPath: string): string[] {
		try {
			const directoryContent = fs.readdirSync(folderPath, {
				withFileTypes: true,
			});

			return directoryContent
				.filter((entry) => entry.isDirectory())
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
			const directoryContent = fs.readdirSync(folderPath, {
				withFileTypes: true,
			});
			const files = directoryContent
				.filter((entry) => entry.isFile())
				.map((entry) => join(folderPath, entry.name));

			if (recursive) {
				const directories = this.getDirectoriesInFolder(folderPath);

				files.push(
					...directories.flatMap((directory) =>
						this.getFilesInFolder(directory, true),
					),
				);
			}
			return files;
		} catch {
			throw new FolderDoesNotExistException(folderPath);
		}
	}
}
