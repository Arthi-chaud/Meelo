import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import { Release, Song, Track, TrackType } from '@prisma/client';
import SongService from 'src/song/song.service';
import { MasterTrackNotFoundException, TrackAlreadyExistsException, TrackNotFoundByIdException } from './track.exceptions';
import ReleaseService from 'src/release/release.service';
import TrackQueryParameters from './models/track.query-parameters';
import FileQueryParameters from 'src/file/models/file.query-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import FileService from 'src/file/file.service';
import Slug from 'src/slug/slug';
import { FileNotFoundFromIDException, FileNotFoundFromPathException } from 'src/file/file.exceptions';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { UrlGeneratorService } from 'nestjs-url-generator';
import { TrackController } from './track.controller';
import FileController from 'src/file/file.controller';
import type Tracklist from './models/tracklist.model';
import { UnknownDiscIndexKey } from './models/tracklist.model';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';

@Injectable()
export default class TrackService {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		private releaseService: ReleaseService,
		private fileService: FileService,
		private prismaService: PrismaService,
		private readonly urlGeneratorService: UrlGeneratorService
	) { }
	/**
	 * Create a Track, and saves it in the database
	 * @param track the parameters to build the track
	 * @param include the relation fields to include in the returned object
	 * @returns the created song
	 */
	async createTrack(
		track: TrackQueryParameters.CreateInput,
		include?: TrackQueryParameters.RelationInclude
	) {
		try {
			return await this.prismaService.track.create({
				data: {
					...track,
					song: {
						connect: SongQueryParameters.buildQueryParametersForOne(track.song)
					},
					release: {
						connect: ReleaseQueryParameters.buildQueryParametersForOne(track.release)
					},
					sourceFile: {
						connect: FileQueryParameters.buildQueryParametersForOne(track.sourceFile)
					}
				},
				include
			});
		} catch {
			const parentSong = await this.songService.getSong(track.song, { artist: true });
			const parentRelease = await this.releaseService.getRelease(track.release);
			await this.fileService.getFile(track.sourceFile);
			throw new TrackAlreadyExistsException(
				track.displayName,
				new Slug(parentRelease.slug),
				new Slug(parentSong.artist.slug)
			);
		}
	}
	/**
	 * Finds a track in the database
	 * @param where the query parameters to find the track
	 * @param include the relations to include in the returned value
	 */
	async getTrack(
		where: TrackQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude
	) {
		try {
			return await this.prismaService.track.findFirst({
				rejectOnNotFound: true,
				where: TrackQueryParameters.buildQueryParametersForOne(where),
				include: TrackQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw await this.getTrackNotFoundError(where);
		}
	}

	/**
	 * Find tracks
	 * @param where the query parameters to find the tracks
	 * @param include the relation fields to includes
	 * @returns an array of tracks
	 */
	async getTracks(
		where: TrackQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: TrackQueryParameters.RelationInclude,
		sort?: TrackQueryParameters.SortingParameter
	) {
		return this.prismaService.track.findMany({
			where: TrackQueryParameters.buildQueryParametersForMany(where),
			include: TrackQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Fetch the tracks from a song
	 * Returns an empty array if the song does not exist
	 * @param where the parameters to find the parent song
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned objects
	 * @returns the list of tracks related to the song
	 */
	async getSongTracks(
		where: SongQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: TrackQueryParameters.RelationInclude,
		sort?: TrackQueryParameters.SortingParameter
	) {

		const tracks = await this.getTracks(
			{ bySong: where },
			pagination,
			include,
			sort
		);
		if (tracks.length == 0)
			await this.songService.getSong(where);
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
		return this.getTrack(
			{ masterOfSong: where },
			include
		);
	}

	/**
	 * Get Tracklist of release
	 * @param where 
	 * @returns 
	 */
	async getTracklist(
		where: ReleaseQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude
	): Promise<Tracklist> {
		let tracklist: Tracklist = new Map();
		const tracks = await this.getTracks({ byRelease: where }, {}, include, { sortBy: 'trackIndex', order: 'asc' });
		if (tracks.length == 0)
			await this.releaseService.getRelease(where);
		tracks.forEach((track) => {
			const indexToString = track.discIndex?.toString() ?? UnknownDiscIndexKey;
			tracklist = tracklist.set(indexToString, [ ...tracklist.get(indexToString) ?? [], track]);
		});
		return tracklist;
	}

	/**
	 * Count the tracks that match the query parameters
	 * @param where the query parameters
	 */
	async countTracks(where: TrackQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.track.count({
			where: TrackQueryParameters.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Updates the track in the database
	 * @param what the fields to update in the track
	 * @param where the query parameters to find the track to update
	 */
	
	async updateTrack(
		what: TrackQueryParameters.UpdateInput,
		where: TrackQueryParameters.WhereInput
	) {
		try {
			const unmodifiedTrack = await this.getTrack(where);
			let updatedTrack = await this.prismaService.track.update({
				data: {
					...what,
					song: what.song ? {
						connect: SongQueryParameters.buildQueryParametersForOne(what.song)
					} : undefined,
					release: what.release ? {
						connect: ReleaseQueryParameters.buildQueryParametersForOne(what.release)
					} : undefined,
					sourceFile: what.sourceFile ? {
						connect: FileQueryParameters.buildQueryParametersForOne(what.sourceFile)
					} : undefined
				},
				where: TrackQueryParameters.buildQueryParametersForOne(where),
			});
			const masterChangeInput: TrackQueryParameters.UpdateSongMaster = {
				trackId: updatedTrack.id,
				song: { byId: { id: updatedTrack.songId } }
			};
			if (!unmodifiedTrack.master && what.master) {
				await this.setTrackAsMaster(masterChangeInput);
			} else if (unmodifiedTrack.master && what.master === false) {
				await this.unsetTrackAsMaster(masterChangeInput);
			}
			return updatedTrack;
		} catch {
			throw await this.getTrackNotFoundError(where);
		}
	}

	/**
	 * Deletes a track
	 * @param where Query parameters to find the track to delete 
	 */
	async deleteTrack(where: TrackQueryParameters.DeleteInput, deleteParentIfEmpty: boolean = true): Promise<void> {
		try {
			let deletedTrack = await this.prismaService.track.delete({
				where: where,
			});
			Logger.warn(`Track '${deletedTrack.displayName}' deleted`);
			if (deletedTrack.master)
				await this.unsetTrackAsMaster({
					trackId: deletedTrack.id,
					song: { byId: { id: deletedTrack.songId } }
				});
			if (deleteParentIfEmpty) {
				await this.songService.deleteSongIfEmpty({ byId: { id: deletedTrack.songId } });
				await this.releaseService.deleteReleaseIfEmpty({ byId: { id: deletedTrack.releaseId } });
			}
		} catch {
			if (where.id !== undefined)
				throw new TrackNotFoundByIdException(where.id);
			throw new FileNotFoundFromIDException(where.sourceFileId);
		}
	}

	/**
	 * Callback on track not found
	 * @param where the query parameters that failed to get the release
	 */
	private async getTrackNotFoundError(where: TrackQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.id !== undefined)
			throw new TrackNotFoundByIdException(where.id);
		if (where.masterOfSong) {
			const parentSong = await this.songService.getSong(where.masterOfSong, { artist: true });
			throw new MasterTrackNotFoundException(
				new Slug(parentSong.slug),
				new Slug(parentSong.artist!.slug)
			);
		} 
		if (where.sourceFile.id !== undefined)
			throw new FileNotFoundFromIDException(where.sourceFile.id);
		throw new FileNotFoundFromPathException(where.sourceFile.byPath!.path);
	}

	/**
	 * Sets provided track as the song's master track, unsetting other master from the same song
	 * @param where the query parameters to find the track to set as master
	 */
	async setTrackAsMaster(where: TrackQueryParameters.UpdateSongMaster): Promise<void> {
		let otherTracks: Track[] = (await this.getSongTracks(where.song))
			.filter((track) => track.id != where.trackId);
		
		await Promise.allSettled([
			this.prismaService.track.updateMany({
				data: { master: false },
				where: {
					id: {
						in: otherTracks.map((track) => track.id)
					}
				}
			}),
			this.updateTrack(
				{ master: true },
				{ id: where.trackId }
			)
		]);
	}

	/**
	 * Unsets provided track as the song's master track, setting another track as master of the song
	 * @param where the query parameters to find the track to unset as master
	 */
	async unsetTrackAsMaster(where: TrackQueryParameters.UpdateSongMaster): Promise<void> {
		let otherTracks: Track[] = (await this.getSongTracks(where.song, {}, {}, { sortBy: 'id', order: 'asc' }))
			.filter((track) => track.id != where.trackId);
		if (otherTracks.find((track) => track.master))
			return;
		if (otherTracks.length == 0)
			return;
		let newMaster = otherTracks[0];
		const audioTracks = otherTracks.filter((track) => track.type == TrackType.Audio);
		if (audioTracks.length != 0)
			newMaster = audioTracks[0];
		await Promise.allSettled([
			this.updateTrack(
				{ master: true },
				{ id: newMaster.id }
			),
			this.updateTrack(
				{ master: false },
				{ id: where.trackId }
			)
		]);
	}

	buildTrackResponse(track: Track & Partial<{ release: Release, song: Song }>): Object {
		let response: Object = {
			...track,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: TrackController,
				controllerMethod: TrackController.prototype.getTrackIllustration,
				params: {
					id: track.id.toString()
				}
			}),
			stream: this.urlGeneratorService.generateUrlFromController({
				controller: FileController,
				controllerMethod: FileController.prototype.streamFile,
				params: {
					id: track.sourceFileId.toString()
				}
			})
		};
		if (track.release !== undefined)
			response = {
				...response,
				release: this.releaseService.buildReleaseResponse(track.release)
			}
		if (track.song != undefined)
			response = {
				...response,
				song: this.songService.buildSongResponse(track.song)
			}
		return response;
	}

	buildTracklistResponse(tracklist: Tracklist) {
		let response = {};
		tracklist.forEach((tracks, discIndex) => {
			response = {
				...response,
				[discIndex]: tracks.map((track) => this.buildTrackResponse(track))
			}
		});
		return response;
	} 
}
