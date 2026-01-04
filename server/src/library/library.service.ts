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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "src/prisma/generated/client";
import normalize from "normalize-path";
import { PrismaError } from "prisma-error-enum";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import FileService from "src/file/file.service";
import { HousekeepingService } from "src/housekeeping/housekeeping.service";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import type { Library } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import { RegistrationService } from "src/registration/registration.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import {
	LibraryAlreadyExistsException,
	LibraryNotFoundException,
} from "./library.exceptions";
import type LibraryQueryParameters from "./models/library.query-parameters";

@Injectable()
export default class LibraryService {
	constructor(
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private housekeepingService: HousekeepingService,
		private registrationService: RegistrationService,
		protected prismaService: PrismaService,
	) {}

	async create(input: LibraryQueryParameters.CreateInput) {
		try {
			return await this.prismaService.library.create({
				data: {
					name: input.name,
					path: normalize(input.path, true),
					slug: new Slug(input.name).toString(),
				},
			});
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === PrismaError.UniqueConstraintViolation
			) {
				throw new LibraryAlreadyExistsException(
					new Slug(input.name),
					input.path,
				);
			}
			throw new UnhandledORMErrorException(error, input);
		}
	}

	async update(
		what: LibraryQueryParameters.UpdateInput,
		where: LibraryQueryParameters.WhereInput,
	) {
		try {
			return await this.prismaService.library.update({
				data: {
					...what,
					path: what.path ? normalize(what.path, true) : undefined,
					slug: what.name
						? new Slug(what.name).toString()
						: undefined,
				},
				where: LibraryService.formatWhereInput(where),
			});
		} catch (error) {
			//TODO Handle duplicates
			throw this.onNotFound(error, where);
		}
	}

	/**
	 * Get
	 */
	static formatWhereInput(input: LibraryQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
		};
	}

	static formatManyWhereInput(input: LibraryQueryParameters.ManyWhereInput) {
		return {
			name: input.name
				? buildStringSearchParameters(input.name)
				: undefined,
			id: input.id,
		};
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	formatSortingInput(
		sortingParameter: LibraryQueryParameters.SortingParameter,
	): Prisma.LibraryOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ slug: sortingParameter.order }];
			case "fileCount":
				return [
					{ files: { _count: sortingParameter.order } },
					{ slug: "asc" },
				];
			case "addDate":
				return [{ id: sortingParameter.order }];
			default:
				return [
					{
						[sortingParameter.sortBy ?? "id"]:
							sortingParameter.order,
					},
				];
		}
	}

	async get<I extends LibraryQueryParameters.RelationInclude = {}>(
		where: LibraryQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: LibraryService.formatWhereInput(where),
		};
		try {
			return await this.prismaService.library.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.LibraryFindFirstOrThrowArgs
				>
			>(args);
		} catch (error) {
			throw this.onNotFound(error, where);
		}
	}

	async getMany(
		where: LibraryQueryParameters.ManyWhereInput,
		sort?: LibraryQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
	) {
		return this.prismaService.library.findMany({
			where: LibraryService.formatManyWhereInput(where),
			orderBy: this.formatSortingInput(sort ?? {}),
			...formatPaginationParameters(pagination),
		});
	}

	onNotFound(error: Error, where: LibraryQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			return new LibraryNotFoundException(where.slug ?? where.id);
		}
		return new UnhandledORMErrorException(error, where);
	}

	/**
	 * Deletes a Library from the database, its files and related tracks
	 * @param where the query parameters to find the library to delete
	 * @returns the deleted library
	 */
	async delete(where: LibraryQueryParameters.WhereInput): Promise<Library> {
		const relatedFiles = await this.fileService.getMany({ library: where });

		await this.registrationService.unregisterFiles(
			relatedFiles.map((file) => ({ id: file.id })),
		);
		await this.housekeepingService.runHousekeeping();
		return this.prismaService.library
			.delete({
				where: LibraryService.formatWhereInput(where),
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}
}
