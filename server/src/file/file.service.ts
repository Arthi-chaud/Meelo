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
import * as fs from 'fs';
import path from 'path';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { buildDateSearchParameters } from 'src/utils/search-date-input';
import LibraryService from 'src/library/library.service';
import mime from 'mime';
import { Prisma } from '@prisma/client';
import SortingParameter from 'src/sort/models/sorting-parameter';
import Slug from 'src/slug/slug';
import Identifier from 'src/identifier/models/identifier';

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
	Prisma.FileOrderByWithRelationInput
> {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService
	) {
		super(prismaService.file);
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

	protected onCreationFailure(input: FileQueryParameters.CreateInput) {
		return new FileAlreadyExistsException(input.path, input.libraryId);
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
		return {
			id: where.ids !== undefined ? {
				in: where.ids
			} : undefined,
			library: where.library
				? LibraryService.formatWhereInput(where.library)
				: undefined,
			path: where.paths !== undefined ? {
				in: where.paths
			} : undefined,
			registerDate: where.registrationDate
				? buildDateSearchParameters(where.registrationDate)
				: undefined
		};
	}

	formatManyWhereInput = FileService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): FileQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			RepositoryService.UnexpectedStringIdentifier
		);
	}

	formatSortingInput(
		sort: SortingParameter<FileQueryParameters.SortingKeys>
	): Prisma.FileOrderByWithRelationInput {
		switch (sort.sortBy) {
		case 'addDate':
			return { id: sort.order };
		case 'trackArtist':
			return { track: { song: { artist: { slug: sort.order } } } };
		case 'trackName':
			return { track: { song: { slug: sort.order } } };
		default:
			return { [sort.sortBy ?? 'id']: sort.order };
		}
	}

	onNotFound(where: FileQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined) {
			return new FileNotFoundFromIDException(where.id);
		} else if (where.trackId !== undefined) {
			return new FileNotFoundFromTrackIDException(where.trackId);
		}
		return new FileNotFoundFromPathException(where.byPath.path);
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
			md5Checksum: await this.fileManagerService.getMd5Checksum(fullFilePath),
			registerDate: new Date(),
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
