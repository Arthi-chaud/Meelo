import { Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { FileNotReadableException } from './file.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { Library, File } from '@prisma/client';

@Injectable()
export class FileService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService
	) {}

	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, excluding base dataFolder & parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		const libraryPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const fullFilePath = `${libraryPath}/${filePath}`;
		if (this.fileManagerService.fileIsReadable(fullFilePath) == false) {
			throw new FileNotReadableException(filePath);
		}

		return await this.prismaService.file.create({
			data: {
				path: filePath,
				md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath).toString(),
				registerDate: new Date(),
				libraryId: parentLibrary.id
			}
		});
	}

	/**
	 * Find File entites whose path is contained in the filePaths parameters
	 * @param filePaths an array of file paths, without base folder or parent library's base folder
	 * @returns 
	 */
	async findFilesFromPath(filePaths: string[]) {
		return await this.prismaService.file.findMany({
			where: {
				path: {
					in: filePaths
				},
			}
		});
	}

	/**
	 * Remove files entries
	 * @param files the Files to delete
	 * @returns 
	 */
	async removeFileEntries(...files: File[]) {
		let idsToDelete = files.map((file) => file.id);
		return await this.prismaService.file.deleteMany({
			where: {
				id: {
					in: idsToDelete
				}
			}
		});
	}
}
