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

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import FileManagerService from "../file-manager/file-manager.service";
import {
	FileAlreadyExistsException,
	FileNotFoundException,
	FileNotFoundFromTrackIDException,
} from "./file.exceptions";
import PrismaService from "src/prisma/prisma.service";
import type { File } from "src/prisma/models";
import type FileQueryParameters from "./models/file.query-parameters";
import { buildDateSearchParameters } from "src/utils/search-date-input";
import LibraryService from "src/library/library.service";
import { Prisma } from "@prisma/client";
import Identifier from "src/identifier/models/identifier";
import { PrismaError } from "prisma-error-enum";
import deepmerge from "deepmerge";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import AlbumService from "src/album/album.service";
import SongService from "src/song/song.service";
import TrackService from "src/track/track.service";
import ReleaseService from "src/release/release.service";

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
	async update(
		where: FileQueryParameters.WhereInput,
		what: Pick<File, "checksum" | "registerDate">,
	) {
		return this.prismaService.file
			.update({
				where: FileService.formatWhereInput(where),
				data: what,
			})
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

	async getMany(
		where: FileQueryParameters.ManyWhereInput,
		pagination: PaginationParameters = {},
	) {
		return this.prismaService.file.findMany({
			where: FileService.formatManyWhereInput(where),
			orderBy: { id: "asc" },
			...formatPaginationParameters(pagination),
		});
	}

	static formatManyWhereInput(where: FileQueryParameters.ManyWhereInput) {
		let query: Prisma.FileWhereInput = {};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.library) {
			query = deepmerge<Prisma.FileWhereInput>(query, {
				library: LibraryService.formatWhereInput(where.library),
			});
		}
		if (where.album) {
			query = deepmerge<Prisma.FileWhereInput>(query, {
				track: {
					release: {
						album: AlbumService.formatWhereInput(where.album),
					},
				},
			});
		}
		if (where.release) {
			query = deepmerge<Prisma.FileWhereInput>(query, {
				track: {
					release: ReleaseService.formatWhereInput(where.release),
				},
			});
		}
		if (where.song) {
			query = deepmerge<Prisma.FileWhereInput>(query, {
				track: {
					song: SongService.formatWhereInput(where.song),
				},
			});
		}
		if (where.track) {
			query = deepmerge<Prisma.FileWhereInput>(query, {
				track: TrackService.formatWhereInput(where.track),
			});
		}
		if (where.paths) {
			query = deepmerge(query, {
				path: {
					in: where.paths,
				},
			});
		}
		if (where.inFolder) {
			query = deepmerge(query, {
				path: {
					startsWith: where.inFolder,
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
			if (where.trackId !== undefined) {
				return new FileNotFoundFromTrackIDException(where.trackId);
			}
			return new FileNotFoundException(where.id ?? where.byPath.path);
		}
		return new UnhandledORMErrorException(error, where);
	}

	async create(input: FileQueryParameters.CreateInput) {
		return this.prismaService.file
			.create({
				data: {
					path: input.path,
					checksum: input.checksum,
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
}
