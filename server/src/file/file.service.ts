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

import {
	HttpStatus,
	Inject,
	Injectable,
	StreamableFile,
	forwardRef,
} from "@nestjs/common";
import FileManagerService from "src/file-manager/file-manager.service";
import {
	FileAlreadyExistsException,
	FileNotFoundFromIDException,
	FileNotFoundFromPathException,
	FileNotFoundFromTrackIDException,
	SourceFileNotFoundExceptions,
} from "./file.exceptions";
import PrismaService from "src/prisma/prisma.service";
import type { File, Library } from "src/prisma/models";
import type FileQueryParameters from "./models/file.query-parameters";
import { FileNotReadableException } from "src/file-manager/file-manager.exceptions";
// eslint-disable-next-line no-restricted-imports
import * as fs from "fs";
import path from "path";
import { buildDateSearchParameters } from "src/utils/search-date-input";
import LibraryService from "src/library/library.service";
import mime from "mime";
import { Prisma } from "@prisma/client";
import Slug from "src/slug/slug";
import Identifier from "src/identifier/models/identifier";
import { PrismaError } from "prisma-error-enum";
import deepmerge from "deepmerge";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { formatIdentifier } from "src/repository/repository.utils";
import { InvalidRequestException } from "src/exceptions/meelo-exception";

@Injectable()
export default class FileService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService,
	) {}

	async get<I extends FileQueryParameters.RelationInclude = {}>(
		where: FileQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: FileService.formatWhereInput(where),
		};
		return this.prismaService.file
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.FileFindFirstOrThrowArgs
				>
			>(args)
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	/**
	 * find a file
	 */
	static formatWhereInput(where: FileQueryParameters.WhereInput) {
		return {
			id: where.id,
			track: where.trackId
				? {
						id: where.trackId,
				  }
				: undefined,
			path: where.byPath?.path,
			library: where.byPath
				? LibraryService.formatWhereInput(where.byPath.library)
				: undefined,
		};
	}

	async getMany(where: FileQueryParameters.ManyWhereInput) {
		return this.prismaService.file.findMany({
			where: FileService.formatManyWhereInput(where),
		});
	}

	static formatManyWhereInput(where: FileQueryParameters.ManyWhereInput) {
		let query: Prisma.FileWhereInput = {};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.library) {
			query = deepmerge(query, {
				library: LibraryService.formatWhereInput(where.library),
			});
		}
		if (where.paths) {
			query = deepmerge(query, {
				path: {
					in: where.paths,
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

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): FileQueryParameters.WhereInput {
		return formatIdentifier(identifier, (_) => {
			throw new InvalidRequestException(
				`Identifier: expected a number, got ${identifier}`,
			);
		});
	}

	onNotFound(error: Error, where: FileQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				return new FileNotFoundFromIDException(where.id);
			} else if (where.trackId !== undefined) {
				return new FileNotFoundFromTrackIDException(where.trackId);
			}
			return new FileNotFoundFromPathException(where.byPath.path);
		}
		return new UnhandledORMErrorException(error, where);
	}

	async create(input: FileQueryParameters.CreateInput) {
		return this.prismaService.file
			.create({
				data: {
					path: input.path,
					md5Checksum: input.md5Checksum,
					registerDate: input.registerDate,
					libraryId: input.libraryId,
				},
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code == PrismaError.UniqueConstraintViolation
				) {
					throw new FileAlreadyExistsException(
						input.path,
						input.libraryId,
					);
				}
				throw new UnhandledORMErrorException(error, input);
			});
	}

	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, relative to parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	async registerFile(
		filePath: string,
		parentLibrary: Library,
		registrationDate?: Date,
	): Promise<File> {
		const libraryPath =
			this.fileManagerService.getLibraryFullPath(parentLibrary);
		const fullFilePath = `${libraryPath}/${filePath}`;

		if (!this.fileManagerService.fileIsReadable(fullFilePath)) {
			throw new FileNotReadableException(filePath);
		}
		return this.create({
			md5Checksum: await this.fileManagerService.getMd5Checksum(
				fullFilePath,
			),
			path: filePath,
			libraryId: parentLibrary.id,
			registerDate: registrationDate ?? new Date(),
		});
	}

	/**
	 * Builds full path of file
	 * @param where the query parameters to find the file entry in the database
	 */
	async buildFullPath(
		where: FileQueryParameters.WhereInput,
	): Promise<string> {
		const file = await this.get(where);
		const library = await this.libraryService.get({ id: file.libraryId });
		const libraryPath = this.fileManagerService.getLibraryFullPath(library);

		return `${libraryPath}/${file.path}`.normalize();
	}

	async delete(where: FileQueryParameters.DeleteInput) {
		return this.prismaService.file
			.delete({
				where: FileService.formatWhereInput(where),
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	/**
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the file
	 */
	async streamFile(
		where: FileQueryParameters.WhereInput,
		res: any,
		req: any,
	): Promise<StreamableFile> {
		const file = await this.get(where);
		const fullFilePath = await this.buildFullPath(where);
		const fileExtension = path.parse(fullFilePath).ext;
		const sanitizedFileName = new Slug(
			path.parse(file.path).name,
		).toString();

		if (this.fileManagerService.fileExists(fullFilePath) == false) {
			throw new SourceFileNotFoundExceptions(file.path);
		}
		res.set({
			"Content-Disposition": `attachment; filename="${sanitizedFileName}${fileExtension}"`,
			"Content-Type":
				mime.getType(fullFilePath) ?? "application/octet-stream",
		});
		const rangeHeader = req.headers["range"] ?? req.headers["Range"];
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
					"Content-Range": `bytes ${requestedStartByte}-${requestedEndByte}/${fileSize}`,
				});
			}
		}

		return new StreamableFile(
			fs.createReadStream(fullFilePath, {
				start: requestedStartByte,
				end: requestedEndByte,
			}),
		);
	}
}
