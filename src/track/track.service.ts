import { Injectable } from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import type { Track } from '@prisma/client';
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
import { buildPaginationParameters, PaginationParameters } from 'src/pagination/parameters';
import type { MeeloException } from 'src/exceptions/meelo-exception';

@Injectable()
export default class TrackService {
	constructor(
		private songService: SongService,
		private releaseService: ReleaseService,
		private fileService: FileService,
		private prismaService: PrismaService,
	) { }
	/**
	 * Create a Track, and saves it in the database
	 * @param track the parameters to build the track
	 * @param include the relation fields to include in the returned object
	 * @returns the created song
	 */
	async createTrack(track: TrackQueryParameters.CreateInput, include?: TrackQueryParameters.RelationInclude) {
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
	async getTrack(where: TrackQueryParameters.WhereInput, include?: TrackQueryParameters.RelationInclude) {
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
	async getTracks(where: TrackQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: TrackQueryParameters.RelationInclude) {
		return await this.prismaService.track.findMany({
			where: TrackQueryParameters.buildQueryParametersForMany(where),
			include: TrackQueryParameters.buildIncludeParameters(include),
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
	async getSongTracks(where: SongQueryParameters.WhereInput, pagination?: PaginationParameters, include?: TrackQueryParameters.RelationInclude) {
		return await this.getTracks(
			{ bySong: where },
			pagination,
			include
		);
	}


	/**
	 * Fetch the master tracks of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the master track of the song
	 */
	async getMasterTrack(where: SongQueryParameters.WhereInput, include?: TrackQueryParameters.RelationInclude) {
		return await this.getTrack(
			{ masterOfSong: where },
			include
		);
	}

	/**
	 * Count the tracks that match the query parameters
	 * @param where the query parameters
	 */
	async countTracks(where: TrackQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.track.count({
			where: TrackQueryParameters.buildQueryParametersForMany(where)
		}));
	}

	/**
	 * Updates the track in the database
	 * @param what the fields to update in the track
	 * @param where the query parameters to find the track to update
	 */
	
	async updateTrack(what: TrackQueryParameters.UpdateInput, where: TrackQueryParameters.WhereInput) {
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
			if (unmodifiedTrack.master == false && what.master) {
				await this.setTrackAsMaster(masterChangeInput);
			} else if (unmodifiedTrack.master && what.master === false) {
				await this.unsetTrackAsMaster(masterChangeInput);
			};
			return updatedTrack;
		} catch {
			throw await this.getTrackNotFoundError(where);
		}
	}

	/**
	 * Deletes a track
	 * @param where Query parameters to find the track to delete 
	 */
	 async deleteTrack(where: TrackQueryParameters.WhereInput): Promise<void> {
		try {
			const trackToDelete = await this.getTrack(where);
			if (trackToDelete.master)
				await this.unsetTrackAsMaster({
					trackId: trackToDelete.id,
					song: { byId: { id: trackToDelete.songId } }
				});
			let deletedTrack = await this.prismaService.track.delete({
				where: TrackQueryParameters.buildQueryParametersForOne(where),
			});
			await Promise.allSettled([
				this.songService.deleteSongIfEmpty({ byId: { id: deletedTrack.songId } }),
				this.releaseService.deleteReleaseIfEmpty({ byId: { id: deletedTrack.releaseId } })
			]);
		} catch {
			throw await this.getTrackNotFoundError(where);
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
		throw new FileNotFoundFromPathException(where.sourceFile.path!);
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
		let otherTracks: Track[] = (await this.getSongTracks(where.song))
			.filter((track) => track.id != where.trackId);
		if (otherTracks.find((track) => track.master))
			return;
		if (otherTracks.length == 0)
			return;
		await Promise.allSettled([
			this.updateTrack(
				{ master: true },
				{ id: otherTracks.at(0)!.id }
			),
			this.updateTrack(
				{ master: false },
				{ id: where.trackId }
			)
		]);
	}
}
