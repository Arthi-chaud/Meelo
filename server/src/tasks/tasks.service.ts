import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
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
import Logger from 'src/logger/logger';
import SettingsService from 'src/settings/settings.service';
import TrackIllustrationService from 'src/track/track-illustration.service';
import FfmpegService from 'src/ffmpeg/ffmpeg.service';
import { NotFoundException } from 'src/exceptions/meelo-exception';
import SongService from 'src/song/song.service';
import ReleaseService from 'src/release/release.service';
import AlbumService from 'src/album/album.service';
import ArtistService from 'src/artist/artist.service';
import GenreService from 'src/genre/genre.service';

@Injectable()
export default class TasksService {
	private readonly logger = new Logger(TasksService.name);
	constructor(
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private trackIllustrationService: TrackIllustrationService,
		@Inject(forwardRef(() => MetadataService))
		private metadataService: MetadataService,
		private lyricsService: LyricsService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		private ffmpegService: FfmpegService,
		private songService: SongService,
		private releaseService: ReleaseService,
		private albumService: AlbumService,
		private artistService: ArtistService,
		private genresService: GenreService,
	) {}

	/**
	 * Registers new files a Library
	 * @param parentLibrary The Library the files will be registered under
	 * @returns The array of newly registered Files
	 */
	async registerNewFiles(parentLibrary: Library): Promise<File[]> {
		this.logger.log(`'${parentLibrary.slug}' library: Registration of new files`);
		const libraryFullPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const unfilteredCandidates = this.fileManagerService.getFilesInFolder(
			libraryFullPath, true
		).map((candidateFullPath) => candidateFullPath.substring(libraryFullPath.length + 1));
		const alreadyRegistrered = await this.fileService.getMany({ paths: unfilteredCandidates });

		const candidates = unfilteredCandidates
			.filter((candidatePath) => {
				return alreadyRegistrered.findIndex(
					(registered) => registered.path == candidatePath
				) == -1;
			})
			.filter((candidate) => {
				const matchingRegex = this.settingsService.settingsValues.trackRegex.filter(
					(regex) => candidate.match(regex) != null
				).at(0);

				if (matchingRegex) {
					this.logger.warn(`File '${candidate}' does not match any of the regexes`);
					return false;
				}
				return true;
			});

		const newlyRegistered: File[] = [];

		for (const candidate of candidates) {
			try {
				newlyRegistered.push(await this.registerFile(candidate, parentLibrary));
			} catch (error){
				this.logger.error(error.message);
				continue;
			}
		}
		this.logger.log(`${parentLibrary.slug} library: ${newlyRegistered.length} new files registered`);
		return newlyRegistered;
	}

	/**
	 * Registers a File in the database, parses and push its metadata
	 * @param filePath the short path of the file to register (without base folder and library folder)
	 * @param parentLibrary the parent library to register the file under
	 * @returns a registered File entity
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		this.logger.log(`${parentLibrary.slug} library: Registration of ${filePath}`);
		const fullFilePath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}/${filePath}`;
		const fileMetadata = await this.metadataService.parseMetadata(fullFilePath);
		const registeredFile = await this.fileService.registerFile(filePath, parentLibrary);

		try {
			const track = await this.metadataService.registerMetadata(fileMetadata, registeredFile);

			this.lyricsService.registerLyrics(
				{ id: track.songId }, { force: false }
			).catch(() => {});
			this.illustrationService.extractTrackIllustration(track, fullFilePath)
				.catch(() => {})
				.then(async () => {
					if (track.type == 'Video') {
						const illustrationPath = await this.trackIllustrationService
							.getIllustrationPath(
								{ id: track.id }
							);

						if (!this.trackIllustrationService.illustrationExists(illustrationPath)) {
							this.ffmpegService.takeVideoScreenshot(
								fullFilePath, illustrationPath
							);
						}
					}
				});
		} catch (err) {
			await this.fileService.delete({ id: registeredFile.id });
			this.logger.warn(`${parentLibrary.slug} library: Registration of ${filePath} failed because of bad metadata`);
			throw err;
		}
		return registeredFile;
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param where the query parameters to find the parent library to clean
	 * @returns The array of deleted file entry
	 */
	async unregisterUnavailableFiles(where: LibraryQueryParameters.WhereInput): Promise<File[]> {
		const parentLibrary = await this.libraryService.get(where, { files: true });

		this.logger.log(`'Cleaning ${parentLibrary.slug}' library`);
		const libraryPath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}`;
		const registeredFiles: File[] = parentLibrary.files;
		const unavailableFiles: File[] = registeredFiles.filter(
			(file) => !this.fileManagerService.fileExists(`${libraryPath}/${file.path}`)
		);

		this.logger.warn(`'${parentLibrary.slug}' library: Removing ${unavailableFiles.length} entries`);
		try {
			await Promise.all(
				unavailableFiles.map((file) => this.unregisterFile({ id: file.id }))
			);
			this.logger.warn(`'${parentLibrary.slug}' library: Removed ${unavailableFiles.length} entries`);
			await this.housekeeping();
		} catch (error) {
			this.logger.error(`'${parentLibrary.slug}' library: Cleaning failed:`);
			this.logger.error(error);
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
		const updatedFiles: File[] = [];

		this.logger.log(`'${library.slug}' library: Refresh files metadata`);
		await Promise.all(
			library.files.map(async (file) => {
				const fullFilePath = `${libraryFullPath}/${file.path}`;
				const fileStat = await this.fileManagerService.getFileStat(fullFilePath);

				/**
				 * If file has not been changed since, the md5checkum computation and rescan is canceled
				 */
				if (fileStat.mtime <= file.registerDate && fileStat.ctime <= file.registerDate) {
					return;
				}
				const newMD5 = await this.fileManagerService
					.getMd5Checksum(fullFilePath)
					.catch(() => null);

				if (newMD5 !== file.md5Checksum) {
					updatedFiles.push(file);
				}
			})
		);
		for (const file of updatedFiles) {
			this.logger.log(`'${library.slug}' library: Refreshing '${file.path}' metadata`);
			await this.unregisterFile({ id: file.id });
			await this.registerFile(file.path, library);
		}
		this.logger.log(`'${library.slug}' library: Refreshed ${updatedFiles.length} files metadata`);
		await this.housekeeping();
		return updatedFiles;
	}

	async unregisterFile(where: FileQueryParameters.DeleteInput, housekeeping = false) {
		await this.trackService.delete({ sourceFileId: where.id }).catch((error) => {
			if (!(error instanceof NotFoundException)) {
				throw error;
			}
		});
		await this.fileService.delete(where);
		if (housekeeping) {
			await this.housekeeping();
		}
	}

	/**
	 * Calls housekeeping methods on repository services
	 */
	async housekeeping(): Promise<void> {
		await this.songService.housekeeping();
		await this.releaseService.housekeeping();
		await this.albumService.housekeeping();
		await this.artistService.housekeeping();
		await this.genresService.housekeeping();
	}
}
