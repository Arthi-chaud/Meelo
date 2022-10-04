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
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import TrackService from 'src/track/track.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { LyricsService } from 'src/lyrics/lyrics.service';
import { buildStringSearchParameters } from 'src/utils/search-string-input';

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
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private metadataService: MetadataService,
		private lyricsService: LyricsService,
		private illustrationService: IllustrationService,
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
			await this.unregisterFile({ id: file.id });
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
			try {
				newlyRegistered.push(await this.registerFile(candidate, parentLibrary));
			} catch {
				continue;
			}
		}
		Logger.log(`${parentLibrary.slug} library: ${newlyRegistered.length} new files registered`);
		return newlyRegistered;
	}

	/**
	 * Re-register files who have been modified since their scan
	 * Any file that has a different md5checksum that the one in the db will be re-registered
	 * @param where 
	 */
	async resyncAllMetadata(where: LibraryQueryParameters.WhereInput): Promise<File[]> {
		const library = await this.get(where, { files: true });
		let updatedFiles: File[] = [];
		Logger.log(`'${library.slug}' library: Refresh files metadata`);
		for (const file of library.files) {
			const fullFilePath = `${this.fileManagerService.getLibraryFullPath(library)}/${file.path}`;
			if (!this.fileManagerService.fileExists(fullFilePath))
				continue;
			const newMD5 = await this.fileManagerService.getMd5Checksum(fullFilePath);
			if (newMD5 !== file.md5Checksum) {
				Logger.log(`'${library.slug}' library: Refreshing '${file.path}' metadata`);
				await this.unregisterFile({ id: file.id });
				await this.registerFile(file.path, library);
				updatedFiles.push({ ...file, md5Checksum: newMD5 });
			}
		}
		Logger.log(`'${library.slug}' library: Refreshed ${updatedFiles.length} files metadata`);
		return updatedFiles;
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
			this.lyricsService.registerLyrics({ byId: { id: track.songId } }, { force: false }).catch(() => {});
			this.illustrationService.extractTrackIllustration(track, fullFilePath)
				.catch(() => {})
				.then(async () => {
					if (track.type == 'Video') {
						const illustrationPath = await this.trackService.buildIllustrationPath({ id: track.id });
						if (this.illustrationService.illustrationExists(illustrationPath) == false)
							this.illustrationService.takeVideoScreenshot(fullFilePath, illustrationPath);
					}
				});
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

	async buildResponse(input: Library): Promise<Library> {
		return input;
	}
}
