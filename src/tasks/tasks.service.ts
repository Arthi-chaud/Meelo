import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import type LibraryQueryParameters from 'src/library/models/library.query-parameters';
import type { File, Library } from 'src/prisma/models';
import FileManagerService from 'src/file-manager/file-manager.service';
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import TrackService from 'src/track/track.service';
import FileService from 'src/file/file.service';
import MetadataService from 'src/metadata/metadata.service';
import IllustrationService from 'src/illustration/illustration.service';
import { LyricsService } from 'src/lyrics/lyrics.service';
import LibraryService from 'src/library/library.service';

@Injectable()
export default class TasksService {
	constructor(
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private trackService: TrackService,
		private metadataService: MetadataService,
		private lyricsService: LyricsService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService,
		private illustrationService: IllustrationService,
	) {}

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
			} catch (e){
				Logger.error(e.message);
				continue;
			}
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
		let parentLibrary = await this.libraryService.get(where, { files: true });
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

	/**
	 * Re-register files who have been modified since their scan
	 * Any file that has a different md5checksum that the one in the db will be re-registered
	 * @param where 
	 */
	async resyncAllMetadata(where: LibraryQueryParameters.WhereInput): Promise<File[]> {
		const library = await this.libraryService.get(where, { files: true });
		const libraryFullPath = this.fileManagerService.getLibraryFullPath(library);
		let updatedFiles: File[] = [];
		Logger.log(`'${library.slug}' library: Refresh files metadata`);
		await Promise.all(
			library.files.map(async (file) => {
				const fullFilePath = `${libraryFullPath}/${file.path}`;
				const newMD5 = await this.fileManagerService.getMd5Checksum(fullFilePath).catch(() => null);
				if (newMD5 !== file.md5Checksum)
					updatedFiles.push(file);
			})
		)
		for (const file of updatedFiles) {
			Logger.log(`'${library.slug}' library: Refreshing '${file.path}' metadata`);
			await this.unregisterFile({ id: file.id });
			await this.registerFile(file.path, library);
		}
		Logger.log(`'${library.slug}' library: Refreshed ${updatedFiles.length} files metadata`);
		return updatedFiles;
	}

	async unregisterFile(where: FileQueryParameters.DeleteInput) {
		await this.trackService.delete({ sourceFileId: where.id });
		await this.fileService.delete(where);
	}
}
