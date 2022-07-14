import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export default class LibraryService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		private fileService: FileService,
		private metadataService: MetadataService,
		private illustrationService: IllustrationService
	) {}
	
	/**
	 * Creates a Library
	 * @param library the parameters needed to create a Library
	 * @param include the relation fields to include in the returned object
	 * @returns 
	 */
	async createLibrary(library: LibraryQueryParameters.CreateInput, include?: LibraryQueryParameters.RelationInclude ): Promise<Library> {
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
	 async getLibrary(where: LibraryQueryParameters.WhereInput, include?: LibraryQueryParameters.RelationInclude) {
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
			if (where.id !== undefined)
				throw new LibraryNotFoundFromIDException(where.id);
			throw new LibraryNotFoundException(where.slug);
		}
	}

	/**
	 * Get multiple Libraries
	 * @param where the query parameters to find the libraries
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relation fields to include in the returned objects
	 * @returns 
	 */
	async getLibraries(where: LibraryQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: LibraryQueryParameters.RelationInclude) {
		return this.prismaService.library.findMany({
			where: LibraryQueryParameters.buildQueryParametersForMany(where),
			include: LibraryQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination)
		});
	}

	async updateLibrary(what: LibraryQueryParameters.UpdateInput, where: LibraryQueryParameters.WhereInput): Promise<Library> {
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
			if (where.id !== undefined)
				throw new LibraryNotFoundFromIDException(where.id);
			throw new LibraryNotFoundException(where.slug);
		}
	}

	/**
	 * Deletes a Library from the database
	 * @param where the query parameters to find the library to delete
	 * @returns the deleted library
	 */
	async deleteLibrary(where: LibraryQueryParameters.WhereInput): Promise<Library> {
		try {
			return await this.prismaService.library.delete({
				where: LibraryQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			if (where.id !== undefined)
				throw new LibraryNotFoundFromIDException(where.id);
			throw new LibraryNotFoundException(where.slug);
		}
	}

	/**
	 * Registers new files a Library
	 * @param parentLibrary The Library the files will be registered under
	 * @returns The array of newly registered Files
	 */
	async registerNewFiles(parentLibrary: Library): Promise<File[]> {
		Logger.log(`'${parentLibrary.slug}' library: Registration of new files`);
		let unfilteredCandidates = this.fileManagerService.getCandidateFilesInLibraryFolder(parentLibrary.path);
		let alreadyRegistrered = await this.fileService.getFiles({ paths: unfilteredCandidates });

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
		} catch {
			await this.fileService.deleteFile({ id: registeredFile.id });
			Logger.warn(`${parentLibrary.slug} library: Registration of ${filePath} failed because of bad metadata.`);
		}
		return registeredFile
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param parentLibraryId the id of the library to clean
	 * @returns The array of deleted file entry
	 */
	async unregisterUnavailableFiles(parentLibraryId: number): Promise<File[]> {
		let parentLibrary = await this.getLibrary({ id: parentLibraryId }, { files: true });
		Logger.log(`'Cleaning ${parentLibrary.slug}' library`);
		const libraryPath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}`;
		let registeredFiles: File[] = parentLibrary.files;
		let unavailableFiles: File[] = registeredFiles.filter(
			(file) => !this.fileManagerService.fileExists(`${libraryPath}/${file.path}`)
		);
		Logger.log(`'${parentLibrary.slug}' library: Removing ${unavailableFiles.length} entries`);
		this.fileService.deleteFiles({ ids: unavailableFiles.map((f) => f.id) });
		return unavailableFiles;
	}
}
