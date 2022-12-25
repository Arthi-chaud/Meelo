import {
	Inject, Injectable, Logger, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import FileService from 'src/file/file.service';
import MetadataService from 'src/metadata/metadata.service';
import Slug from 'src/slug/slug';
import {
	LibraryAlreadyExistsException, LibraryNotFoundException, LibraryNotFoundFromIDException
} from './library.exceptions';
import { Prisma } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import IllustrationService from 'src/illustration/illustration.service';
import type LibraryQueryParameters from './models/library.query-parameters';
import normalize from 'normalize-path';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import TasksService from 'src/tasks/tasks.service';
import { Library, LibraryWithRelations } from 'src/prisma/models';
import SortingParameter from 'src/sort/models/sorting-parameter';
import { parseIdentifierSlugs } from 'src/identifier/identifier.parse-slugs';
import Identifier from 'src/identifier/models/identifier';

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
	Prisma.LibraryOrderByWithRelationInput
> {
	constructor(
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => MetadataService))
		private metadataService: MetadataService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => TasksService))
		private tasksService: TasksService,
		prismaService: PrismaService,
	) {
		super(prismaService.library);
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

	protected formatCreateInputToWhereInput(input: LibraryQueryParameters.CreateInput) {
		return { slug: new Slug(input.name) };
	}

	protected onCreationFailure(input: LibraryQueryParameters.CreateInput) {
		return new LibraryAlreadyExistsException(new Slug(input.name), input.path);
	}

	/**
	 * Get
	 */
	static formatWhereInput(input: LibraryQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString()
		};
	}

	formatWhereInput = LibraryService.formatWhereInput;

	static formatManyWhereInput(input: LibraryQueryParameters.ManyWhereInput) {
		return {
			name: input.name ? buildStringSearchParameters(input.name) : undefined
		};
	}

	formatManyWhereInput = LibraryService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): LibraryQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(identifier, (stringIdentifier) => {
			const [slug] = parseIdentifierSlugs(stringIdentifier, 1);

			return { slug };
		});
	}

	formatSortingInput(
		sortingParameter: SortingParameter<LibraryQueryParameters.SortingKeys>
	): Prisma.LibraryOrderByWithRelationInput {
		switch (sortingParameter.sortBy) {
		case 'name':
			return { slug: sortingParameter.order };
		case 'fileCount':
			return { files: { _count: sortingParameter.order } };
		case 'addDate':
			return { id: sortingParameter.order };
		case undefined:
			return { id: sortingParameter.order };
		default:
			return { [sortingParameter.sortBy]: sortingParameter.order };
		}
	}

	onNotFound(where: LibraryQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined) {
			return new LibraryNotFoundFromIDException(where.id);
		}
		return new LibraryNotFoundException(where.slug);
	}

	/**
	 * Update
	 */
	formatUpdateInput(input: LibraryQueryParameters.UpdateInput) {
		return {
			...input,
			path: input.path ? normalize(input.path, true) : undefined,
			slug: input.name ? new Slug(input.name).toString() : undefined
		};
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: LibraryQueryParameters.WhereInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(input: LibraryQueryParameters.WhereInput) {
		return input;
	}

	/**
	 * Deletes a Library from the database, its files and related tracks
	 * @param where the query parameters to find the library to delete
	 * @returns the deleted library
	 */
	async delete(where: LibraryQueryParameters.WhereInput): Promise<Library> {
		const relatedFiles = await this.fileService.getMany({ library: where });

		for (const file of relatedFiles) {
			await this.tasksService.unregisterFile({ id: file.id });
		}
		return super.delete(where);
	}

	async applyMetadataOnFiles(parentLibrary: Library): Promise<void> {
		Logger.log(`'${parentLibrary.slug}' library: Applying metadata started`);
		const files = await this.fileService.getMany({ library: { id: parentLibrary.id } });
		const libraryPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const updatedFilesCount = (await Promise.allSettled(
			files.map(async (file) => {
				await this.metadataService.applyMetadataOnFile({ id: file.id });
				await this.illustrationService.applyIllustrationOnFile({ id: file.id });
				const newMd5 = await this.fileManagerService.getMd5Checksum(`${libraryPath}/${file.path}`);

				await this.fileService.update({ md5Checksum: newMd5 }, { id: file.id });
			})
		)).length;

		Logger.log(`${parentLibrary.slug} library: ${updatedFilesCount} files updated`);
	}

	async buildResponse(input: Library): Promise<Library> {
		return input;
	}
}
