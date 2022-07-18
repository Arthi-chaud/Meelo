import { Injectable, StreamableFile } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import { FileAlreadyExistsException, FileNotFoundFromIDException, FileNotFoundFromPathException, FileNotFoundFromTrackIDException } from './file.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type { Library, File } from '@prisma/client';
import FileQueryParameters from './models/file.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import { FileDoesNotExistException, FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
import * as fs from 'fs';
import path from 'path';
import SettingsService from 'src/settings/settings.service';
@Injectable()
export default class FileService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		private settingsService: SettingsService
	) {}

	/**
	 * saves a File in the database
	 * @param file the parameters needed to build & save the File
	 * @param include the relation to include in the returned File
	 * @returns the saved file
	 */
	async createFile(file: FileQueryParameters.CreateInput, include?: FileQueryParameters.RelationInclude): Promise<File> {
		try {
			return await this.prismaService.file.create({
				data: file,
				include: FileQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw new FileAlreadyExistsException(file.path, file.libraryId)
		}
	}

	/**
	 * Retrives a file using query parameters
	 * @param where the query parameters to find the file
	 * @param include the relation to include in the returned object
	 * @returns a File entry
	 */
	async getFile(where: FileQueryParameters.WhereInput, include?: FileQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.file.findFirst({
				rejectOnNotFound: true,
				where: FileQueryParameters.buildQueryParametersForOne(where),
				include: FileQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			if (where.id !== undefined)
				throw new FileNotFoundFromIDException(where.id);
			else if (where.trackId !== undefined)
				throw new FileNotFoundFromTrackIDException(where.trackId);
			throw new FileNotFoundFromPathException(where.byPath.path);
		}
	}

	/**
	 * Retrives multiple files using query parameters
	 * @param where where the query parameters to find the file
	 * @param pagination the pagination paramters to filter entries
	 * @param include include the relation to include in the returned objects
	 * @returns an array of File
	 */
	async getFiles(where: FileQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: FileQueryParameters.RelationInclude) {
		return this.prismaService.file.findMany({
			where: FileQueryParameters.buildQueryParametersForMany(where),
			include: FileQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Coun the Files that matches the query parameters
	 * @param where the parameters to compare the Files with
	 * @returns the number of match
	 */
	async countFiles(where: FileQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.file.count({
			where: FileQueryParameters.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Update a File in the database
	 * @param what the new values
	 * @param where the parameters to get the Files to update
	 * @returns the updated files
	 */
	async updateFile(what: FileQueryParameters.UpdateInput, where: FileQueryParameters.WhereInput): Promise<File> {
		return this.prismaService.file.update({
			data: {...what},
			where: FileQueryParameters.buildQueryParametersForOne(where)
		});
	}

	/**
	 * Delete a File in the database
	 * @param where the parameters to get the file to delete
	 * @returns an empty promise
	 */
	async deleteFile(where: FileQueryParameters.DeleteInput): Promise<void> {
		try {
			await this.prismaService.file.delete({
				where: FileQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw new FileNotFoundFromIDException(where.id);
		}
		
	}

	/**
	 * Delete multiple Files in the database
	 * @param where the parameters to get the file to delete
	 * @returns the number of deleted file
	 */
	 async deleteFiles(where: FileQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.file.deleteMany({
			where: FileQueryParameters.buildQueryParametersForMany(where)
		})).count;
	}

	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, relative to parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		const libraryPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const fullFilePath = `${libraryPath}/${filePath}`;
		if (!this.fileManagerService.fileIsReadable(fullFilePath)) {
			throw new FileNotReadableException(filePath);
		}

		return this.createFile({
			path: filePath,
			md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath).toString(),
			registerDate: new Date(),
			libraryId: parentLibrary.id
		});
	}

	/**
	 * 
	 * @param file the file object of the file to stream
	 * @param parentlibrary parent library of the file to stream
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the file
	 */
	streamFile(file: File, parentLibrary: Library, res: any): StreamableFile {
		const fullFilePath = `${this.settingsService.settingsValues.dataFolder}/${parentLibrary.path}/${file.path}`.normalize();
		if (this.fileManagerService.fileExists(fullFilePath) == false)
			throw new FileDoesNotExistException(file.path);
		res.set({
			'Content-Disposition': `attachment; filename="${path.parse(file.path).base}"`,
		});
		return new StreamableFile(fs.createReadStream(fullFilePath));
	}
}
