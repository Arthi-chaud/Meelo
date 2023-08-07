import Task from './models/tasks';
import {
	OnQueueError, Process, Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import {
	HttpStatus, Inject, forwardRef
} from '@nestjs/common';
import type LibraryQueryParameters from 'src/library/models/library.query-parameters';
import type { File } from 'src/prisma/models';
import FileManagerService from 'src/file-manager/file-manager.service';
import type FileQueryParameters from 'src/file/models/file.query-parameters';
import TrackService from 'src/track/track.service';
import FileService from 'src/file/file.service';
import MetadataService from 'src/metadata/metadata.service';
import IllustrationService from 'src/illustration/illustration.service';
import LibraryService from 'src/library/library.service';
import Logger from 'src/logger/logger';
import SettingsService from 'src/settings/settings.service';
import { MeeloException, NotFoundException } from 'src/exceptions/meelo-exception';
import SongService from 'src/song/song.service';
import ReleaseService from 'src/release/release.service';
import AlbumService from 'src/album/album.service';
import ArtistService from 'src/artist/artist.service';
import GenreService from 'src/genre/genre.service';
import ExternalIdService from 'src/providers/external-id.provider';
import { LyricsService } from 'src/lyrics/lyrics.service';
import PlaylistService from 'src/playlist/playlist.service';
import IllustrationRepository from 'src/illustration/illustration.repository';
import { SongType } from '@prisma/client';
import ParserService from 'src/metadata/parser.service';
import RefreshMetadataSelector from './models/refresh-metadata.selector';

export const TaskQueue = 'task-queue';

@Processor(TaskQueue)
export default class TaskRunner {
	private readonly logger = new Logger(TaskRunner.name);
	constructor(
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => MetadataService))
		private metadataService: MetadataService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => GenreService))
		private genresService: GenreService,
		private externalIdService: ExternalIdService,
		private lyricsService: LyricsService,
		@Inject(forwardRef(() => PlaylistService))
		private playlistService: PlaylistService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
	) { }

	@OnQueueError()
	onError(err: Error) {
		throw new MeeloException(HttpStatus.INTERNAL_SERVER_ERROR, err.message);
	}

	@Process('*')
	async processTask(job: Job<any>) {
		const taskName = job.name as Task;

		switch (taskName) {
		case Task.UnregisterFile:
			return this.runTask(job, (where) => this.unregisterFile(where));
		case Task.CleanLibrary:
			return this.runTask(job, (where) => this.cleanLibrary(where));
		case Task.ScanLibrary:
			return this.runTask(job, (where) => this.scanLibrary(where));
		case Task.Housekeeping:
			return this.runTask(job, () => this.housekeeping());
		case Task.RefreshMetadata:
			return this.runTask(job, (where: string) =>
				this.refreshFilesMetadata(JSON.parse(where)));
		case Task.FetchExternalMetadata:
			return this.runTask(job, () => this.fetchExternalMetadata());
		case Task.Clean:
			job.name = Task.CleanLibrary;
			return this.forEachLibrary(job, (where) => this.cleanLibrary(where));
		case Task.Scan:
			job.name = Task.ScanLibrary;
			return this.forEachLibrary(job, (where) => this.scanLibrary(where));
		}
		await job.moveToFailed({ message: 'Unknown Task' });
	}

	private async runTask<T>(
		job: Job<T>,
		task: (payload: T) => Promise<void>
	): Promise<void> {
		this.logger.log(`Task '${job.name}' started`);
		try {
			await task(job.data);
			this.logger.log(`Task '${job.name}' completed`);
		} catch (err) {
			this.logger.error(`Task '${job.name}' failed: ${err.message}`);
			await job.moveToFailed({ message: err.message });
		}
	}

	/**
	 * Run task for each library
	 * One after the other
	 */
	private async forEachLibrary(
		job: Job<unknown>,
		task: (where: LibraryQueryParameters.WhereInput) => Promise<void>
	) {
		const libraries = await this.libraryService.getMany({});

		for (const library of libraries) {
			job.data = { id: library.id };
			await this.runTask(job, task);
		}
	}

	/**
	 * Registers new files a Library
	 * @param where the query parameters to find the parent library the files will be registered under
	 * @returns The array of newly registered Files
	 */
	private async scanLibrary(where: LibraryQueryParameters.WhereInput): Promise<void> {
		const parentLibrary = await this.libraryService.get(where);

		this.logger.log(`'${parentLibrary.slug}' library: Registration of new files`);
		const libraryFullPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const unfilteredCandidates = this.fileManagerService.getFilesInFolder(
			libraryFullPath, true
		).map((candidateFullPath) => candidateFullPath.substring(libraryFullPath.length + 1));
		const alreadyRegistrered = await this.fileService.getMany({ paths: unfilteredCandidates });

		const candidates = unfilteredCandidates
			.filter((candidatePath) => {
				// Removing cover.jpg files from candidates
				return candidatePath.match(`/${IllustrationService.SOURCE_ILLUSTRATON_FILE}$`) == null;
			})
			.filter((candidatePath) => {
				return alreadyRegistrered.findIndex(
					(registered) => registered.path == candidatePath
				) == -1;
			})
			.filter((candidate) => {
				const matchingRegex = this.settingsService.settingsValues.trackRegex.filter(
					(regex) => candidate.match(regex) != null
				).at(0);

				if (!matchingRegex) {
					this.logger.warn(`File '${candidate}' does not match any of the regexes`);
					return false;
				}
				return true;
			});

		const newlyRegistered: File[] = [];

		for (const candidate of candidates) {
			try {
				newlyRegistered.push(await this.registerFile(candidate, { id: parentLibrary.id }));
			} catch (error) {
				continue;
			}
		}
		this.logger.log(`${parentLibrary.slug} library: ${newlyRegistered.length} new files registered`);
		await this.findSongTypes();
	}

	/**
	 * Unregisters files from parentLibrary that are not existing
	 * @param where the query parameters to find the parent library to clean
	 * @returns The array of deleted file entry
	 */
	private async cleanLibrary(where: LibraryQueryParameters.WhereInput): Promise<void> {
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
	}

	private async refreshFilesMetadata(where: RefreshMetadataSelector): Promise<void> {
		const tracks = await (where.track !== undefined ?
			this.trackService.get(where.track, { sourceFile: true })
				.then((track) => [track]) :
			this.trackService.getMany({
				album: where.album,
				library: where.library,
				release: where.release,
				song: where.song
			}, undefined, { sourceFile: true }));
		const updatedFiles: File[] = [];

		await Promise.allSettled(
			tracks.map((track) => this.sourceFileChanged(track.sourceFile)
				.then((fileChanged) => {
					if (fileChanged) {
						updatedFiles.push(track.sourceFile);
					}
				}))
		);

		for (const file of updatedFiles) {
			await this.unregisterFile({ id: file.id });
		}
		await this.housekeeping();
		for (const file of updatedFiles) {
			this.logger.log(`Refreshing '${file.path} metadata`);
			await this.registerFile(file.path, { id: file.libraryId }, file.registerDate);
		}
		this.logger.log(`Refreshed ${updatedFiles.length} files' metadata`);
	}

	private async fetchExternalMetadata(): Promise<void> {
		await this.fetchExternalIds();
		await this.fetchExternalIllustrations();
		await this.lyricsService.fetchMissingLyrics();
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
		await this.playlistService.housekeeping();
	}

	///// Sub tasks

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
	 * Fetch Missing External IDs for artists, songs and albums
	 */
	private async fetchExternalIds(): Promise<void> {
		await this.externalIdService.fetchMissingArtistExternalIDs();
		await this.externalIdService.fetchMissingAlbumExternalIDs();
		await this.externalIdService.fetchMissingSongExternalIDs();
	}

	/**
	 * Fetch Missing External Illustrations from providers
	 */
	private fetchExternalIllustrations(): Promise<void> {
		return this.illustrationRepository.downloadMissingArtistIllustrations();
	}

	/**
	 * Registers a File in the database, parses and push its metadata
	 * @param filePath the short path of the file to register (without base folder and library folder)
	 * @param parentLibrary the parent library to register the file under
	 * @param registrationDate optional date to custom registration date of models
	 * @returns a registered File entity
	 */
	private async registerFile(
		filePath: string, libraryWhere: LibraryQueryParameters.WhereInput, registrationDate?: Date
	): Promise<File> {
		const parentLibrary = await this.libraryService.get(libraryWhere);

		this.logger.log(`${parentLibrary.slug} library: Registration of ${filePath}`);
		const fullFilePath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}/${filePath}`;
		const fileMetadata = await this.metadataService.parseMetadata(fullFilePath).catch((err) => {
			this.logger.error(`${parentLibrary.slug} library: Registration of ${filePath} failed`);
			this.logger.error(err);
			throw err;
		});
		const registeredFile = await this.fileService.registerFile(
			filePath, parentLibrary, registrationDate
		);

		try {
			const track = await this.metadataService.registerMetadata(fileMetadata, registeredFile);

			this.illustrationRepository.registerTrackFileIllustration(
				{ id: track.id }, fullFilePath
			)
				.catch(() => {})
				.then(() => {
					if (track.type == 'Video') {
						this.illustrationRepository
							.registerVideoTrackScreenshot({ id: track.id }, fullFilePath)
							.catch(() => {});
					}
				});
		} catch (err) {
			await this.fileService.delete({ id: registeredFile.id });
			this.logger.error(`${parentLibrary.slug} library: Registration of ${filePath} failed`);
			this.logger.error(err);
			throw err;
		}
		return registeredFile;
	}

	private async findSongTypes() {
		const songs = await this.songService.getMany({ type: SongType.Unknown });

		await Promise.allSettled(songs.map((song) => {
			this.songService.update(
				{ type: this.parserService.getSongType(song.name) },
				{ id: song.id }
			);
		}));
	}

	/// Utils

	/**
	 * Determines whether souce file changed since its registration, based on its date and MD5 checksum
	 */
	private async sourceFileChanged(file: File): Promise<boolean> {
		const parentLibrary = await this.libraryService.get({ id: file.libraryId });
		const fullFilePath = `${this.fileManagerService.getLibraryFullPath(parentLibrary)}/${file.path}`;
		const fileStat = await this.fileManagerService.getFileStat(fullFilePath);

		/**
		 * If file has not been changed since, the md5checkum computation and rescan is canceled
		 */
		if (fileStat.mtime <= file.registerDate && fileStat.ctime <= file.registerDate) {
			return false;
		}
		const newMD5 = await this.fileManagerService
			.getMd5Checksum(fullFilePath)
			.catch(() => null);

		if (newMD5 !== file.md5Checksum) {
			return true;
		}
		return false;
	}
}
