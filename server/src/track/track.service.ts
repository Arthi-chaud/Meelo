import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import SongService from 'src/song/song.service';
import {
	MasterTrackNotFoundException,
	TrackAlreadyExistsException,
	TrackNotFoundByIdException
} from './track.exceptions';
import ReleaseService from 'src/release/release.service';
import type TrackQueryParameters from './models/track.query-parameters';
import type ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import type SongQueryParameters from 'src/song/models/song.query-params';
import FileService from 'src/file/file.service';
import Slug from 'src/slug/slug';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import Tracklist, { UnknownDiscIndexKey } from './models/tracklist.model';
import RepositoryService from 'src/repository/repository.service';
import { shuffle } from '@taumechanica/stout';
import AlbumService from 'src/album/album.service';
import LibraryService from 'src/library/library.service';
import { Track, TrackWithRelations } from 'src/prisma/models';
import Identifier from 'src/identifier/models/identifier';
import Logger from 'src/logger/logger';
import { PrismaError } from 'prisma-error-enum';
import { FileNotFoundFromIDException, FileNotFoundFromPathException } from 'src/file/file.exceptions';
import IllustrationRepository from 'src/illustration/illustration.repository';

@Injectable()
export default class TrackService extends RepositoryService<
	TrackWithRelations,
	TrackQueryParameters.CreateInput,
	TrackQueryParameters.WhereInput,
	TrackQueryParameters.ManyWhereInput,
	TrackQueryParameters.UpdateInput,
	TrackQueryParameters.DeleteInput,
	TrackQueryParameters.SortingKeys,
	Prisma.TrackCreateInput,
	Prisma.TrackWhereInput,
	Prisma.TrackWhereInput,
	Prisma.TrackUpdateInput,
	Prisma.TrackWhereUniqueInput,
	Prisma.TrackOrderByWithRelationAndSearchRelevanceInput
>{
	private readonly logger = new Logger(TrackService.name);
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private illustrationRepository: IllustrationRepository,
		private prismaService: PrismaService
	) {
		super(prismaService.track);
	}

	/**
	 * Create
	 */
	formatCreateInput(input: TrackQueryParameters.CreateInput) {
		return {
			...input,
			song: {
				connect: SongService.formatWhereInput(input.song)
			},
			release: {
				connect: ReleaseService.formatWhereInput(input.release)
			},
			sourceFile: {
				connect: FileService.formatWhereInput(input.sourceFile)
			}
		};
	}

	protected async onCreationFailure(error: Error, input: TrackQueryParameters.CreateInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const parentSong = await this.songService.get(input.song, { artist: true });
			const parentRelease = await this.releaseService.get(input.release);

			await this.fileService.throwIfNotFound(input.sourceFile);
			if (error.code === PrismaError.RequiredRelationViolation) {
				return new TrackAlreadyExistsException(
					input.name,
					new Slug(parentRelease.slug),
					new Slug(parentSong.artist.slug)
				);
			}
		}
		return this.onUnknownError(error, input);
	}

	protected formatCreateInputToWhereInput(
		input: TrackQueryParameters.CreateInput
	): TrackQueryParameters.WhereInput {
		return input;
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: TrackQueryParameters.WhereInput) {
		return {
			id: where.id,
			sourceFile: where.sourceFile ?
				FileService.formatWhereInput(where.sourceFile)
				: undefined
		};
	}

	formatWhereInput = TrackService.formatWhereInput;

	static formatManyWhereInput(
		where: TrackQueryParameters.ManyWhereInput
	): Prisma.TrackWhereInput {
		let queryParameters: Prisma.TrackWhereInput = {
			type: where.type,
			song: where.song ? SongService.formatWhereInput(where.song) : undefined,
			sourceFile: where.library ? {
				library: LibraryService.formatWhereInput(where.library)
			} : undefined,
		};

		if (where.release) {
			queryParameters = {
				...queryParameters,
				release: ReleaseService.formatWhereInput(where.release)
			};
		}
		if (where.album) {
			queryParameters = {
				...queryParameters,
				song: {
					tracks: {
						some: {
							release: {
								album: AlbumService.formatWhereInput(where.album!)
							}
						}
					}
				}
			};
		}
		if (where.artist) {
			queryParameters = {
				...queryParameters,
				release: {
					album: AlbumService.formatManyWhereInput({ artist: where.artist })
				}
			};
		}
		return queryParameters;
	}

	formatManyWhereInput = TrackService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): TrackQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			RepositoryService.UnexpectedStringIdentifier
		);
	}

	formatSortingInput(
		sortingParameter: TrackQueryParameters.SortingParameter
	): Prisma.TrackOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
		case 'releaseName':
			return { release: { name: sortingParameter.order } };
		case 'releaseDate':
			return { release: { releaseDate: { sort: sortingParameter.order, nulls: 'last' } } };
		case 'addDate':
			return { sourceFile: { registerDate: sortingParameter.order } };
		default:
			return { [sortingParameter.sortBy ?? 'id']: sortingParameter.order };
		}
	}

	/**
	 * Callback on track not found
	 * @param where the query parameters that failed to get the release
	 */
	onNotFound(error: Error, where: TrackQueryParameters.WhereInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound) {
			if (where.id !== undefined) {
				return new TrackNotFoundByIdException(where.id);
			}
			if (where.sourceFile.id !== undefined) {
				return new FileNotFoundFromIDException(where.sourceFile.id);
			}
			return new FileNotFoundFromPathException(where.sourceFile.byPath!.path);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Fetch the tracks from a song
	 * Returns an empty array if the song does not exist
	 * @param where the parameters to find the parent song
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned objects
	 * @returns the list of tracks related to the song
	 */
	async getSongTracks<I extends TrackQueryParameters.RelationInclude>(
		where: SongQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: TrackQueryParameters.SortingParameter
	) {
		const tracks = await this.getMany(
			{ song: where },
			pagination,
			include,
			sort
		);

		if (tracks.length == 0) {
			await this.songService.throwIfNotFound(where);
		}
		return tracks;
	}

	/**
	 * Fetch the master tracks of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the master track of the song
	 */
	async getMasterTrack(
		where: SongQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude
	) {
		return this.songService.get(where, { artist: true })
			.then(async (song) => {
				if (song.masterId != null) {
					return this.get({ id: song.masterId }, include);
				}
				const tracks = await this.prismaService.track.findMany({
					where: { song: SongService.formatWhereInput(where) },
					include: RepositoryService.formatInclude(include),
					orderBy: { release: {
						releaseDate: { sort: 'asc', nulls: 'last' }
					} },
				});
				const master = tracks.find((track) => track.type == 'Audio')
					?? tracks.at(0);

				if (!master) {
					throw new MasterTrackNotFoundException(
						new Slug(song.slug), new Slug(song.artist.slug)
					);
				}
				return master;
			});
	}

	/**
	 * Get Tracklist of release
	 * @param where
	 * @returns the tracklist of the release
	 */
	async getTracklist(
		where: ReleaseQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
	): Promise<Tracklist> {
		let tracklist: Tracklist = new Map();
		const tracks = await this.getMany(
			{ release: where }, {}, include, { sortBy: 'trackIndex', order: 'asc' }
		);

		if (tracks.length == 0) {
			await this.releaseService.throwIfNotFound(where);
		}
		tracks.forEach((track) => {
			const indexToString = track.discIndex?.toString() ?? UnknownDiscIndexKey;

			tracklist = tracklist.set(
				indexToString,
				[...tracklist.get(indexToString) ?? [], track]
			);
		});
		return new Map([...tracklist].sort());
	}

	/**
	 * Get Playlist of release
	 * @param where query paremeters to find the release
	 * @returns all the tracks, ordered, from a release
	 */
	async getPlaylist(
		where: ReleaseQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
		random = false
	): Promise<Track[]> {
		const tracklist = await this.getTracklist(where, include);
		let playlist: Track[] = [];

		tracklist.forEach((disc) => playlist = playlist.concat(disc));
		if (random) {
			shuffle(playlist);
		}
		return playlist;
	}

	/**
	 * Update
	 */
	formatUpdateInput(what: Partial<TrackQueryParameters.CreateInput>): Prisma.TrackUpdateInput {
		return {
			...what,
			song: what.song ? {
				connect: SongService.formatWhereInput(what.song)
			} : undefined,
			release: what.release ? {
				connect: ReleaseService.formatWhereInput(what.release)
			} : undefined,
			sourceFile: what.sourceFile ? {
				connect: FileService.formatWhereInput(what.sourceFile)
			} : undefined
		};
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: TrackQueryParameters.DeleteInput) {
		return where;
	}

	protected formatDeleteInputToWhereInput(input: TrackQueryParameters.DeleteInput) {
		if (input.id) {
			return { id: input.id };
		}
		return { sourceFile: { id: input.sourceFileId! } };
	}

	/**
	 * Deletes a track
	 * @param where Query parameters to find the track to delete
	 */
	async delete(where: TrackQueryParameters.DeleteInput): Promise<Track> {
		await this.illustrationRepository.deleteTrackIllustration(
			this.formatDeleteInputToWhereInput(where)
		);

		return super.delete(where).then((deleted) => {
			this.logger.warn(`Track '${deleted.name}' deleted`);
			return deleted;
		});
	}

	/**
	 * Does nothing, nothing to housekeep.
	 */
	async housekeeping(): Promise<void> {}

	/**
	 * Change the track's parent song
	 * If the previous parent is empty, it will be deleted
	 * @param trackWhere the query parameters to find the track to reassign
	 * @param newParentWhere the query parameters to find the song to reassign the track to
	 */
	async reassign(
		trackWhere: TrackQueryParameters.WhereInput,
		newParentWhere: SongQueryParameters.WhereInput
	): Promise<Track> {
		const track = await this.get(trackWhere, { song: true });
		const newParent = await this.songService.get(newParentWhere);

		if (track.id == track.song.masterId) {
			await this.albumService.unsetMasterRelease({ id: track.songId });
		}
		return this.update({ song: { id: newParent.id } }, trackWhere);
	}
}
