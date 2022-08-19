import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import FileService from 'src/file/file.service';
import MetadataService from 'src/metadata/metadata.service';
import Slug from 'src/slug/slug';
import { LibraryAlreadyExistsException, LibraryNotFoundException, LibraryNotFoundFromIDException } from './library.exceptions';
import type { Library, File } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import IllustrationService from 'src/illustration/illustration.service';
import LibraryQueryParameters from './models/library.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import normalize from 'normalize-path';
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import TrackService from 'src/track/track.service';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { LyricsService } from 'src/lyrics/lyrics.service';

@Injectable()
export default class LibraryService extends RepositoryService<
	Library,
	LibraryQueryParameters.CreateInput,
	LibraryQueryParameters.WhereInput,
	LibraryQueryParameters.ManyWhereInput,
	LibraryQueryParameters.UpdateInput,
	LibraryQueryParameters.WhereInput,
	LibraryQueryParameters.RelationInclude,
	{},
	Library
> {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		private fileService: FileService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private metadataService: MetadataService,
		private lyricsService: LyricsService,
		private illustrationService: IllustrationService
	) {
		super();
	}
	
	/**
	 * Creates a Library
	 * @param library the parameters needed to create a Library
	 * @param include the relation fields to include in the returned object
	 * @returns 
	 */
	async create(
		library: LibraryQueryParameters.CreateInput,
		include?: LibraryQueryParameters.RelationInclude
	): Promise<Library> {
		let librarySlug: Slug = new Slug(library.name);
		try {
			return await this.prismaService.library.create({
				data: {
					...library,
					path: normalize(library.path, true),
					slug: librarySlug.toString(),
				},
				include: LibraryQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw new LibraryAlreadyExistsException(librarySlug, library.path);
		}
	}


	/**
	 * Retrieves Library entry
	 * @param where the query parameters to find the library
	 * @param include the relation fields to include in the returned object 
	 * @returns The fetched Library
	 */
	async get(
		where: LibraryQueryParameters.WhereInput,
		include?: LibraryQueryParameters.RelationInclude
	) {
		try {
			return await this.prismaService.library.findUnique({
				rejectOnNotFound: true,
				where: {
					id: where.id,
					slug: where.slug?.toString()
				},
				include: LibraryQueryParameters.buildIncludeParameters(include),
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Find a library and only return specified fields
	 * @param where the parameters to find the library 
	 * @param select the fields to return
	 * @returns the select fields of an object
	 */
	 async select(
		where: LibraryQueryParameters.WhereInput,
		select: Partial<Record<keyof Library, boolean>>
	): Promise<Partial<Library>> {
		try {
			return await this.prismaService.library.findFirst({
				rejectOnNotFound: true,
				where: LibraryQueryParameters.buildQueryParametersForOne(where),
				select: select
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Get multiple Libraries
	 * @param where the query parameters to find the libraries
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relation fields to include in the returned objects
	 * @returns 
	 */
	async getMany(
		where: LibraryQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: LibraryQueryParameters.RelationInclude,
		sort?: LibraryQueryParameters.SortingParameter
	) {
		return this.prismaService.library.findMany({
			where: LibraryQueryParameters.buildQueryParametersForMany(where),
			include: LibraryQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Count the Libraries that matches the query parameters
	 * @param where the parameters to compare the Files with
	 * @returns the number of match
	 */
	 async count(where: LibraryQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.library.count({
			where: LibraryQueryParameters.buildQueryParametersForMany(where)
		});
	}

	async update(
		what: LibraryQueryParameters.UpdateInput,
		where: LibraryQueryParameters.WhereInput
	): Promise<Library> {
		try {
			return await this.prismaService.library.update({
				data: {
					...what,
					path: what.path ? normalize(what.path, true) : undefined,
					slug: what.name ? new Slug(what.name).toString() : undefined
				},
				where: LibraryQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Deletes a Library from the database, its files and related tracks
	 * @param where the query parameters to find the library to delete
	 * @returns the deleted library
	 */
	async delete(where: LibraryQueryParameters.WhereInput): Promise<Library> {
		let relatedFiles = await this.fileService.getMany({ library: where });
		for (const file of relatedFiles)
			await this.unregisterFile({ id: file.id });
		try {
			return await this.prismaService.library.delete({
				where: LibraryQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	async getOrCreate(
		input: LibraryQueryParameters.CreateInput,
		include?: LibraryQueryParameters.RelationInclude
	): Promise<Library> {
		try {
			return await this.get({ slug: new Slug(input.name) }, include);
		} catch {
			return this.create(input, include);
		}
	}

	async applyMetadataOnFiles(parentLibrary: Library): Promise<void> {
		Logger.log(`'${parentLibrary.slug}' library: Applying metadata started`);
		const files = await this.fileService.getMany({ library: { id: parentLibrary.id } });
		const updatedFilesCount = (await Promise.allSettled(
			files.map(async (file) => {
				await this.metadataService.applyMetadataOnFile({ id: file.id });
				await this.illustrationService.applyIllustrationOnFile({ id: file.id });
			})
		)).length;
		Logger.log(`${parentLibrary.slug} library: ${updatedFilesCount} files updated`);
	}

	/**
	 * Registers new files a Library
	 * @param parentLibrary The Library the files will be registered under
	 * @returns The array of newly registered Files
	 */
	async registerNewFiles(parentLibrary: Library): Promise<File[]> {
		Logger.log(`'${parentLibrary.slug}' library: Registration of new files`);
		let unfilteredCandidates = this.fileManagerService.getCandidateFilesInLibraryFolder(parentLibrary.path);
		let alreadyRegistrered = await this.fileService.getMany({ paths: unfilteredCandidates });

		let candidates = unfilteredCandidates.filter(
			(candidatePath) => {
				return alreadyRegistrered.findIndex((registered) => registered.path == candidatePath) == -1;
			}
		);
		let newlyRegistered: File[] = [];

		for (const candidate of candidates) {
			newlyRegistered.push(await this.registerFile(candidate, parentLibrary));
		}
		Logger.log(`${parentLibrary.slug} library: ${newlyRegistered.length} new files registered`);
		return newlyRegistered;
	}

	/**
	 * Registers a File in the database, parses and push its metadata 
	 * @param filePath the short path of the file to register (without base folder and library folder)
	 * @param parentLibrary the parent library to register the file under
	 * @returns a registered File entity
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		Logger.log(`${parentLibrary.slug} library: Registration of ${filePath}`);
		const fullFilePath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}/${filePath}`;
		const fileMetadata = await this.metadataService.parseMetadata(fullFilePath);
		let registeredFile = await this.fileService.registerFile(filePath, parentLibrary);
		try {
			let track = await this.metadataService.registerMetadata(fileMetadata, registeredFile);
			await this.illustrationService.extractTrackIllustration(track, fullFilePath);
			await this.lyricsService.registerLyrics({ byId: { id: track.songId } }, { force: true }).catch(() => {});
		} catch {
			await this.fileService.delete({ id: registeredFile.id });
			Logger.warn(`${parentLibrary.slug} library: Registration of ${filePath} failed because of bad metadata.`);
		}
		return registeredFile
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param where the query parameters to find the parent library to clean
	 * @returns The array of deleted file entry
	 */
	async unregisterUnavailableFiles(where: LibraryQueryParameters.WhereInput): Promise<File[]> {
		let parentLibrary = await this.get(where, { files: true });
		Logger.log(`'Cleaning ${parentLibrary.slug}' library`);
		const libraryPath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}`;
		let registeredFiles: File[] = parentLibrary.files;
		let unavailableFiles: File[] = registeredFiles.filter(
			(file) => !this.fileManagerService.fileExists(`${libraryPath}/${file.path}`)
		);
		Logger.warn(`'${parentLibrary.slug}' library: Removing ${unavailableFiles.length} entries`);
		try {
			for (const unavailableFile of unavailableFiles)
				await this.unregisterFile({ id: unavailableFile.id });
			Logger.warn(`'${parentLibrary.slug}' library: Removed ${unavailableFiles.length} entries`);
		} catch (error) {
			Logger.error(`'${parentLibrary.slug}' library: Cleaning failed:`);
			Logger.error(error);
		}
		return unavailableFiles;
	}

	async unregisterFile(where: FileQueryParameters.DeleteInput) {
		await this.trackService.delete({ sourceFileId: where.id });
		await this.fileService.delete(where);
	}

	buildResponse(input: Library): Library {
		return input;
	}

	onNotFound(where: LibraryQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new LibraryNotFoundFromIDException(where.id);
		return new LibraryNotFoundException(where.slug);
	}
}
