import { Injectable, Logger } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { FileService } from 'src/file/file.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { Slug } from 'src/slug/slug';
import { LibraryAlreadyExistsException, LibraryNotFoundException } from './library.exceptions';
import { LibraryDto } from './models/library.dto';
import { Library, File, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { IllustrationService } from 'src/illustration/illustration.service';
import { IllustrationPath } from 'src/illustration/models/illustration-path.model';

@Injectable()
export class LibraryService {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		private fileService: FileService,
		private metadataService: MetadataService,
		private illustrationService: IllustrationService
	) {}
	
	async createLibrary(createLibraryDto: LibraryDto): Promise<Library> {
		let librarySlug: Slug = new Slug(createLibraryDto.name);
		try {
			return await this.prismaService.library.create({
				data: {
					...createLibraryDto,
					slug: librarySlug.toString()
				}
			});
		} catch {
			throw new LibraryAlreadyExistsException(librarySlug);
		}
	}

	async getAllLibraries(include?: Prisma.LibraryInclude) {
		return await this.prismaService.library.findMany({
			include: {
				files: include?.files ?? false
			}
		});
	}

	/**
	 * Retrieves Library entry using slug
	 * @param slug the slug of the library to fetch
	 * @returns The fetched Library
	 */
	async getLibrary(slug: Slug, include?: Prisma.LibraryInclude) {
		try {
			return await this.prismaService.library.findUnique({
				rejectOnNotFound: true,
				where: {
					slug: slug.toString()
				},
				include: {
					files: include?.files ?? false
				}
			});
		} catch {
			throw new LibraryNotFoundException(slug);
		}
	}

	/**
	 * Delete a Library entry using slug
	 * @param slug the slug of the library to delete
	 */
	async deleteLibrary(slug: Slug): Promise<void> {
		try {
			await this.prismaService.library.delete({
				where: {
					slug: slug.toString()
				}
			});
		} catch {
			throw new LibraryNotFoundException(slug);
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
		let alreadyRegistrered = await this.fileService.getFiles({ byPaths: { paths: unfilteredCandidates }});

		let candidates = unfilteredCandidates.filter(
			(candidatePath) => {
				return alreadyRegistrered.findIndex((registered) => registered.path == candidatePath) == -1;
			}
		);
		let newlyRegistered: File[] = [];

		for (const candidate of candidates) {
			newlyRegistered.push(await this.registerFile(candidate, parentLibrary));
		}
		Logger.log(`${parentLibrary.slug} library: ${candidates.length} new files registered`);
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
			await this.fileService.deleteFile({ byId: { id: registeredFile.id }});
			Logger.log(`${parentLibrary.slug} library: Registration of ${filePath} failed because of bad metadata.`);
		}
		return registeredFile
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param parentLibrarySlug the sluf of the library to clean
	 * @returns The array of deleted file entry
	 */
	async unregisterUnavailableFiles(parentLibrarySlug: Slug): Promise<File[]> {
		let parentLibrary = await this.getLibrary(parentLibrarySlug, { files: true });
		Logger.log(`'Cleaning ${parentLibrary.slug}' library`);
		const libraryPath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}`;
		let registeredFiles: File[] = parentLibrary.files;
		let unavailableFiles: File[] = registeredFiles.filter(
			(file) => this.fileManagerService.fileExists(`${libraryPath}/${file.path}`) == false
		);
		Logger.log(`'${parentLibrary.slug}' library: Removing ${unavailableFiles.length} entries`);
		this.fileService.deleteFiles({ byIds: { ids: unavailableFiles.map((f) => f.id) } });
		return unavailableFiles;
	}
}
