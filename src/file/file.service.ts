import { Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { FileNotFoundFromIDException, FileNotFoundFromPathException, FileNotFoundFromTrackIDException } from './file.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { Library, File } from '@prisma/client';
import { FileRelationInclude, FilesWhereInput, FileWhereInput } from './models/file.query-parameters';
import { FileNotReadableException } from 'src/file-manager/file-manager.exceptions';

@Injectable()
export class FileService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService
	) {}

	/**
	 * Retrives a file using query parameters
	 * @param where the query parameters to find the file
	 * @param include the relation to include in the returned object
	 * @returns a File entry
	 */
	async getFile(where: FileWhereInput, include?: FileRelationInclude) {
		try {
			return await this.prismaService.file.findFirst({
				where: {
					id: where.byId?.id,
					track: where.byTrack ? {
						id: where.byTrack.trackId
					} : undefined,
					path: where.byPath?.path,
				},
				include: {
					track: include?.track,
					library: include?.library,
				}
			});
		} catch {
			if (where.byId)
				throw new FileNotFoundFromIDException(where.byId.id);
			else if (where.byTrack)
				throw new FileNotFoundFromTrackIDException(where.byTrack.trackId);
			throw new FileNotFoundFromPathException(where.byPath.path);
		}
	}

	/**
	 * Retrives multiple files using query parameters
	 * @param where where the query parameters to find the file
	 * @param include include the relation to include in the returned objects
	 * @returns an array of File
	 */
	async getFiles(where: FilesWhereInput, include?: FileRelationInclude) {
		return await this.prismaService.file.findMany({
			where: this.buildQueryParametersForMany(where),
			include: {
				track: include?.track,
				library: include?.library,
			}
		});
	}

	private buildQueryParametersForMany(where: FilesWhereInput) {
		return {
			id: where.byIds ? {
				in: where.byIds.ids
			} : undefined,
			libraryId: where.byLibrary?.libraryId,
			path: where.byPaths ? {
				in: where.byPaths.paths
			} : undefined,
			registerDate: where.byRegistrationDate ? 
				where.byRegistrationDate.on ? {
					gte: new Date (where.byRegistrationDate.on.setHours(0, 0, 0, 0)),
					lt: new Date (where.byRegistrationDate.on.setHours(0, 0, 0, 0) + 3600 * 24)
				} : {
					lt: where.byRegistrationDate.before,
					gt: where.byRegistrationDate.after,
				}
			: undefined
		}
	}

	async countFiles(where: FilesWhereInput): Promise<number> {
		return this.prismaService.file.count({
			where: this.buildQueryParametersForMany(where)
		});
	}

	/**
	 * saves a File in the database
	 * @param file the File object to save
	 * @returns the saved file
	 */
	async saveFile(file: Omit<File, 'id'>): Promise<File> {
		return await this.prismaService.file.create({
			data: {...file, id: undefined}
		});
	}

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

		return await this.saveFile({
			path: filePath,
			md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath).toString(),
			registerDate: new Date(),
			libraryId: parentLibrary.id
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
