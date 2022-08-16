import { Injectable, StreamableFile } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import { FileAlreadyExistsException, FileNotFoundFromIDException, FileNotFoundFromPathException, FileNotFoundFromTrackIDException, SourceFileNotFoundExceptions } from './file.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type { Library, File } from '@prisma/client';
import FileQueryParameters from './models/file.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import { FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
import * as fs from 'fs';
import path from 'path';
import SettingsService from 'src/settings/settings.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
@Injectable()
export default class FileService extends RepositoryService<
	File,
	FileQueryParameters.CreateInput,
	FileQueryParameters.WhereInput,
	FileQueryParameters.ManyWhereInput,
	FileQueryParameters.UpdateInput,
	FileQueryParameters.DeleteInput,
	FileQueryParameters.RelationInclude,
	{},
	File
> {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		private settingsService: SettingsService
	) {
		super();
	}

	/**
	 * saves a File in the database
	 * @param file the parameters needed to build & save the File
	 * @param include the relation to include in the returned File
	 * @returns the saved file
	 */
	async create(file: FileQueryParameters.CreateInput, include?: FileQueryParameters.RelationInclude): Promise<File> {
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
	async get(where: FileQueryParameters.WhereInput, include?: FileQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.file.findFirst({
				rejectOnNotFound: true,
				where: FileQueryParameters.buildQueryParametersForOne(where),
				include: FileQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw this.onNotFound(where)
		}
	}

	/**
	 * Find a file and only return specified fields
	 * @param where the parameters to find the file 
	 * @param select the fields to return
	 * @returns the select fields of an object
	 */
	async select(
		where: FileQueryParameters.WhereInput,
		select: Partial<Record<keyof File, boolean>>
	) {
		try {
			return await this.prismaService.file.findFirst({
				rejectOnNotFound: true,
				where: FileQueryParameters.buildQueryParametersForOne(where),
				select: select
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Retrives multiple files using query parameters
	 * @param where where the query parameters to find the file
	 * @param pagination the pagination paramters to filter entries
	 * @param include include the relation to include in the returned objects
	 * @returns an array of File
	 */
	async getMany(where: FileQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: FileQueryParameters.RelationInclude) {
		return this.prismaService.file.findMany({
			where: FileQueryParameters.buildQueryParametersForMany(where),
			include: FileQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Count the Files that matches the query parameters
	 * @param where the parameters to compare the Files with
	 * @returns the number of match
	 */
	async count(where: FileQueryParameters.ManyWhereInput): Promise<number> {
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
	async update(what: FileQueryParameters.UpdateInput, where: FileQueryParameters.WhereInput): Promise<File> {
		try {
			return await this.prismaService.file.update({
				data: {...what},
				where: FileQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Delete a File in the database
	 * @param where the parameters to get the file to delete
	 * @returns an empty promise
	 */
	async delete(where: FileQueryParameters.DeleteInput): Promise<File> {
		try {
			return await this.prismaService.file.delete({
				where: FileQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw this.onNotFound(where);
		}
		
	}

	/**
	 * Delete multiple Files in the database
	 * @param where the parameters to get the file to delete
	 * @returns the number of deleted file
	 */
	async deleteMany(where: FileQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.file.deleteMany({
			where: FileQueryParameters.buildQueryParametersForMany(where)
		})).count;
	}

	async getOrCreate(
		input: FileQueryParameters.CreateInput,
		include?: FileQueryParameters.RelationInclude
	): Promise<File> {
		try {
			return await this.get({ byPath: { path: input.path, library: { id: input.libraryId } } }, include);
		} catch {
			return this.create(input, include)
		}
	}
	buildResponse(input: File): File {
		return input;
	}

	onNotFound(where: FileQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new FileNotFoundFromIDException(where.id);
		else if (where.trackId !== undefined)
			return new FileNotFoundFromTrackIDException(where.trackId);
		return new FileNotFoundFromPathException(where.byPath.path);
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

		return this.create({
			path: filePath,
			md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath).toString(),
			registerDate: new Date(),
			libraryId: parentLibrary.id
		});
	}

	/**
	 * 
	 * @param file the file object of the file to stream
	 * @param parentLibrary parent library of the file to stream
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the file
	 */
	streamFile(file: File, parentLibrary: Library, res: any): StreamableFile {
		const fullFilePath = `${this.settingsService.settingsValues.dataFolder}/${parentLibrary.path}/${file.path}`.normalize();
		if (this.fileManagerService.fileExists(fullFilePath) == false)
			throw new SourceFileNotFoundExceptions(file.path);
		res.set({
			'Content-Disposition': `attachment; filename="${path.parse(file.path).base}"`,
		});
		return new StreamableFile(fs.createReadStream(fullFilePath));
	}
}
