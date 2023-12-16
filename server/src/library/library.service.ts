import { Inject, Injectable, forwardRef } from "@nestjs/common";
import FileService from "src/file/file.service";
import Slug from "src/slug/slug";
import { Prisma } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import type LibraryQueryParameters from "./models/library.query-parameters";
import normalize from "normalize-path";
import RepositoryService from "src/repository/repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import TasksRunner from "src/tasks/tasks.runner";
import { Library, LibraryWithRelations } from "src/prisma/models";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import Identifier from "src/identifier/models/identifier";
import { PrismaError } from "prisma-error-enum";
import {
	LibraryAlreadyExistsException,
	LibraryNotFoundException,
	LibraryNotFoundFromIDException,
} from "./library.exceptions";

@Injectable()
export default class LibraryService extends RepositoryService<
	LibraryWithRelations,
	LibraryQueryParameters.CreateInput,
	LibraryQueryParameters.WhereInput,
	LibraryQueryParameters.ManyWhereInput,
	LibraryQueryParameters.UpdateInput,
	LibraryQueryParameters.DeleteInput,
	LibraryQueryParameters.SortingKeys,
	Prisma.LibraryCreateInput,
	Prisma.LibraryWhereInput,
	Prisma.LibraryWhereInput,
	Prisma.LibraryUpdateInput,
	Prisma.LibraryWhereUniqueInput,
	Prisma.LibraryOrderByWithRelationAndSearchRelevanceInput
> {
	constructor(
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private tasksService: TasksRunner,
		prismaService: PrismaService,
	) {
		super(prismaService, "library");
	}

	getTableName() {
		return "libraries";
	}

	/**
	 * Create
	 */

	formatCreateInput(input: LibraryQueryParameters.CreateInput) {
		return {
			...input,
			path: normalize(input.path, true),
			slug: new Slug(input.name).toString(),
		};
	}

	protected formatCreateInputToWhereInput(
		input: LibraryQueryParameters.CreateInput,
	) {
		return { slug: new Slug(input.name) };
	}

	protected onCreationFailure(
		error: Error,
		input: LibraryQueryParameters.CreateInput,
	) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.UniqueConstraintViolation
		) {
			return new LibraryAlreadyExistsException(
				new Slug(input.name),
				input.path,
			);
		}
		return this.onUnknownError(error, input);
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

	formatWhereInput = LibraryService.formatWhereInput;

	static formatManyWhereInput(input: LibraryQueryParameters.ManyWhereInput) {
		return {
			name: input.name
				? buildStringSearchParameters(input.name)
				: undefined,
			id: input.id,
		};
	}

	formatManyWhereInput = LibraryService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): LibraryQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const [slug] = parseIdentifierSlugs(stringIdentifier, 1);

				return { slug };
			},
		);
	}

	formatSortingInput(
		sortingParameter: LibraryQueryParameters.SortingParameter,
	): Prisma.LibraryOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "fileCount":
				return { files: { _count: sortingParameter.order } };
			case "addDate":
				return { id: sortingParameter.order };
			case undefined:
				return { id: sortingParameter.order };
			default:
				return { [sortingParameter.sortBy]: sortingParameter.order };
		}
	}

	onNotFound(error: Error, where: LibraryQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				return new LibraryNotFoundFromIDException(where.id);
			}
			return new LibraryNotFoundException(where.slug);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Update
	 */
	formatUpdateInput(input: LibraryQueryParameters.UpdateInput) {
		return {
			...input,
			path: input.path ? normalize(input.path, true) : undefined,
			slug: input.name ? new Slug(input.name).toString() : undefined,
		};
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: LibraryQueryParameters.WhereInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(
		input: LibraryQueryParameters.WhereInput,
	) {
		return input;
	}

	/**
	 * Deletes a Library from the database, its files and related tracks
	 * @param where the query parameters to find the library to delete
	 * @returns the deleted library
	 */
	async delete(where: LibraryQueryParameters.WhereInput): Promise<Library> {
		const relatedFiles = await this.fileService.getMany({ library: where });

		await Promise.all(
			relatedFiles.map((file) =>
				this.tasksService.unregisterFile({ id: file.id }),
			),
		);
		await this.tasksService.housekeeping();
		return super.delete(where);
	}

	async housekeeping(): Promise<void> {}
}
