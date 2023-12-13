import {
	HttpStatus,
	Inject, Injectable, StreamableFile, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import {
	FileAlreadyExistsException,
	FileNotFoundFromIDException,
	FileNotFoundFromPathException,
	FileNotFoundFromTrackIDException,
	SourceFileNotFoundExceptions
} from './file.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type {
	File, FileWithRelations, Library
} from 'src/prisma/models';
import type FileQueryParameters from './models/file.query-parameters';
import { FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
// eslint-disable-next-line no-restricted-imports
import * as fs from 'fs';
import path from 'path';
import RepositoryService from 'src/repository/repository.service';
import { buildDateSearchParameters } from 'src/utils/search-date-input';
import LibraryService from 'src/library/library.service';
import mime from 'mime';
import { Prisma } from '@prisma/client';
import Slug from 'src/slug/slug';
import Identifier from 'src/identifier/models/identifier';
import { PrismaError } from 'prisma-error-enum';
import deepmerge from 'deepmerge';

@Injectable()
export default class FileService extends RepositoryService<
	FileWithRelations,
	FileQueryParameters.CreateInput,
	FileQueryParameters.WhereInput,
	FileQueryParameters.ManyWhereInput,
	FileQueryParameters.UpdateInput,
	FileQueryParameters.DeleteInput,
	FileQueryParameters.SortingKeys,
	Prisma.FileCreateInput,
	Prisma.FileWhereInput,
	Prisma.FileWhereInput,
	Prisma.FileUpdateInput,
	Prisma.FileWhereUniqueInput,
	Prisma.FileOrderByWithRelationAndSearchRelevanceInput
> {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService
	) {
		super(prismaService, 'file');
	}

	getTableName() {
		return 'files';
	}

	/**
	 * Create file
	 */
	formatCreateInput(input: FileQueryParameters.CreateInput) {
		return {
			path: input.path,
			md5Checksum: input.md5Checksum,
			registerDate: input.registerDate,
			library: {
				connect: { id: input.libraryId }
			}
		};
	}

	protected formatCreateInputToWhereInput(
		input: FileQueryParameters.CreateInput
	): FileQueryParameters.WhereInput {
		return { byPath: { path: input.path, library: { id: input.libraryId } } };
	}

	onCreationFailure(error: Error, input: FileQueryParameters.CreateInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError
			&& error.code == PrismaError.UniqueConstraintViolation) {
			return new FileAlreadyExistsException(input.path, input.libraryId);
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * find a file
	 */
	static formatWhereInput(where: FileQueryParameters.WhereInput) {
		return {
			id: where.id,
			track: where.trackId ? {
				id: where.trackId
			} : undefined,
			path: where.byPath?.path,
			library: where.byPath
				? LibraryService.formatWhereInput(where.byPath.library)
				: undefined
		};
	}

	formatWhereInput = FileService.formatWhereInput;

	static formatManyWhereInput(where: FileQueryParameters.ManyWhereInput) {
		let query: Prisma.FileWhereInput = {};

		if (where.ids) {
			query = deepmerge(query, {
				in: where.ids
			});
		}
		if (where.library) {
			query = deepmerge(query, {
				library: LibraryService.formatWhereInput(where.library)
			});
		}
		if (where.paths) {
			query = deepmerge(query, {
				path: {
					in: where.paths
				},
			});
		}
		if (where.registrationDate) {
			query = deepmerge(query, {
				registerDate: buildDateSearchParameters(where.registrationDate),
			});
		}
		return query;
	}

	formatManyWhereInput = FileService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): FileQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			RepositoryService.UnexpectedStringIdentifier
		);
	}

	formatSortingInput(
		sort: FileQueryParameters.SortingParameter
	): Prisma.FileOrderByWithRelationAndSearchRelevanceInput {
		switch (sort.sortBy) {
		case 'addDate':
			return { registerDate: sort.order };
		case 'trackArtist':
			return { track: { song: { artist: { slug: sort.order } } } };
		case 'trackName':
			return { track: { song: { slug: sort.order } } };
		default:
			return { [sort.sortBy ?? 'id']: sort.order };
		}
	}

	onNotFound(error: Error, where: FileQueryParameters.WhereInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound) {
			if (where.id !== undefined) {
				return new FileNotFoundFromIDException(where.id);
			} else if (where.trackId !== undefined) {
				return new FileNotFoundFromTrackIDException(where.trackId);
			}
			return new FileNotFoundFromPathException(where.byPath.path);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Update a File
	 */
	formatUpdateInput(file: FileQueryParameters.UpdateInput) {
		return file;
	}

	/**
	 * Delete a File
	 */
	formatDeleteInput(where: FileQueryParameters.DeleteInput) {
		return where;
	}

	protected formatDeleteInputToWhereInput(where: FileQueryParameters.DeleteInput) {
		return where;
	}

	async deleteMany(where: FileQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.file.deleteMany({
			where: FileService.formatManyWhereInput(where)
		})).count;
	}

	/**
	 * Does nothing, nothing to housekeep
	 */
	async housekeeping(): Promise<void> {}

	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, relative to parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	async registerFile(
		filePath: string,
		parentLibrary: Library,
		registrationDate?: Date
	): Promise<File> {
		const libraryPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const fullFilePath = `${libraryPath}/${filePath}`;

		if (!this.fileManagerService.fileIsReadable(fullFilePath)) {
			throw new FileNotReadableException(filePath);
		}

		return this.create({
			path: filePath,
			md5Checksum: await this.fileManagerService.getMd5Checksum(fullFilePath),
			registerDate: registrationDate ?? new Date(),
			libraryId: parentLibrary.id
		});
	}

	/**
	 * Builds full path of file
	 * @param where the query parameters to find the file entry in the database
	 */
	async buildFullPath(where: FileQueryParameters.WhereInput): Promise<string> {
		const file = await this.get(where);
		const library = await this.libraryService.get({ id: file.libraryId });
		const libraryPath = this.fileManagerService.getLibraryFullPath(library);

		return `${libraryPath}/${file.path}`.normalize();
	}

	/**
	 *
	 * @param file the file object of the file to stream
	 * @param parentLibrary parent library of the file to stream
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the file
	 */
	async streamFile(
		where: FileQueryParameters.WhereInput, res: any, req: any
	): Promise<StreamableFile> {
		const file = await this.get(where);
		const fullFilePath = await this.buildFullPath(where);
		const fileExtension = path.parse(fullFilePath).ext;
		const sanitizedFileName = new Slug(path.parse(file.path).name).toString();

		if (this.fileManagerService.fileExists(fullFilePath) == false) {
			throw new SourceFileNotFoundExceptions(file.path);
		}
		res.set({
			'Content-Disposition': `attachment; filename="${sanitizedFileName}${fileExtension}"`,
			'Content-Type': mime.getType(fullFilePath) ?? 'application/octet-stream',
		});
		const rangeHeader = req.headers['range'] ?? req.headers['Range'];
		let requestedStartByte: number | undefined = undefined;
		let requestedEndByte: number | undefined = undefined;

		if (rangeHeader) {
			res.status(HttpStatus.PARTIAL_CONTENT);
			// eslint-disable-next-line no-useless-escape
			const bytes = /^bytes\=(\d+)\-(\d+)?$/g.exec(rangeHeader);

			if (bytes) {
				const fileSize = fs.statSync(fullFilePath).size;

				requestedStartByte = Number(bytes[1]);
				requestedEndByte = Number(bytes[2]) || fileSize - 1;
				res.set({
					'Content-Range': `bytes ${requestedStartByte}-${requestedEndByte}/${fileSize}`
				});
			}
		}

		return new StreamableFile(
			fs.createReadStream(fullFilePath, { start: requestedStartByte, end: requestedEndByte })
		);
	}
}
