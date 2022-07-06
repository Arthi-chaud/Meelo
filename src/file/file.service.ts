import { Injectable } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import { FileNotFoundFromIDException, FileNotFoundFromPathException, FileNotFoundFromTrackIDException } from './file.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type { Library, File } from '@prisma/client';
import FileQueryParameters from './models/file.query-parameters';
import { buildPaginationParameters, PaginationParameters } from 'src/pagination/parameters';
import { FileNotReadableException } from 'src/file-manager/file-manager.exceptions';

@Injectable()
export default class FileService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService
	) {}

	/**
	 * saves a File in the database
	 * @param file the parameters needed to build & save the File
	 * @param include the relation to include in the returned File
	 * @returns the saved file
	 */
	async createFile(file: FileQueryParameters.CreateInput, include?: FileQueryParameters.RelationInclude): Promise<File> {
		return await this.prismaService.file.create({
			data: file,
			include: FileQueryParameters.buildIncludeParameters(include)
		});
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
			throw new FileNotFoundFromPathException(where.path);
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
		return await this.prismaService.file.findMany({
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
	 * @returns the deleted file
	 */
	async deleteFile(where: FileQueryParameters.WhereInput): Promise<File> {
		return this.prismaService.file.delete({
			where: FileQueryParameters.buildQueryParametersForOne(where)
		});
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
		if (this.fileManagerService.fileIsReadable(fullFilePath) == false) {
			throw new FileNotReadableException(filePath);
		}

		return await this.createFile({
			path: filePath,
			md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath).toString(),
			registerDate: new Date(),
			libraryId: parentLibrary.id
		});
	}
}
