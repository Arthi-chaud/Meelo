import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import FileService from 'src/file/file.service';
import MetadataService from 'src/metadata/metadata.service';
import Slug from 'src/slug/slug';
import { LibraryAlreadyExistsException, LibraryNotFoundException, LibraryNotFoundFromIDException } from './library.exceptions';
import type { Library, File, Prisma } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import IllustrationService from 'src/illustration/illustration.service';
import type LibraryQueryParameters from './models/library.query-parameters';
import normalize from 'normalize-path';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import type TasksService from 'src/tasks/tasks.service';

@Injectable()
export default class LibraryService extends RepositoryService<
	Library,
	{ files: File[] },
	LibraryQueryParameters.CreateInput,
	LibraryQueryParameters.WhereInput,
	LibraryQueryParameters.ManyWhereInput,
	LibraryQueryParameters.UpdateInput,
	LibraryQueryParameters.DeleteInput,
	Prisma.LibraryCreateInput,
	Prisma.LibraryWhereInput,
	Prisma.LibraryWhereInput,
	Prisma.LibraryUpdateInput,
	Prisma.LibraryWhereUniqueInput
> {
	constructor(
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private metadataService: MetadataService,
		private illustrationService: IllustrationService,
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
		}
	}
	protected formatCreateInputToWhereInput(input: LibraryQueryParameters.CreateInput) {
			return { slug: new Slug(input.name) }
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
			name: input.byName ? buildStringSearchParameters(input.byName) : undefined
		};
	}
	formatManyWhereInput = LibraryService.formatManyWhereInput;

	onNotFound(where: LibraryQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new LibraryNotFoundFromIDException(where.id);
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
		let relatedFiles = await this.fileService.getMany({ library: where });
		for (const file of relatedFiles)
			await this.tasksService.unregisterFile({ id: file.id });
		return await super.delete(where);
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
