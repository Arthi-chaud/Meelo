import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Track } from '@prisma/client';
import { SongService } from 'src/song/song.service';
import { TrackNotFoundByIdException } from './track.exceptions';
import { ReleaseService } from 'src/release/release.service';

@Injectable()
export class TrackService {
	constructor(
		private songService: SongService,
		private releaseService: ReleaseService,
		private prismaService: PrismaService
	) {}

	/**
	 * Saves a Track in the database
	 * @param track the track instance to save
	 * @returns the track once saved
	 */
	async saveTrack(track: Omit<Track, 'id'>): Promise<Track> {
		return await this.prismaService.track.create({
			data: {...track}
		});
	}

	/**
	 * Updates a Track in the database
	 * @param track the track instance to update
	 * @returns the track once updated
	 */
	 async updateTrack(track: Track): Promise<Track> {
		return await this.prismaService.track.update({
			data: {...track},
			where: {
				id: track.id
			}
		});
	}

	/**
	 * Deletes a track
	 * If the parent song is empty (ie. has no other songs), it will be deleted too
	 * @param trackId 
	 */
	async deleteTrack(trackId: number): Promise<void> {
		try {
			let deletedTrack = await this.prismaService.track.delete({
				where: {
					id: trackId
				}
			});
			this.songService.deleteSongIfEmpty(deletedTrack.songId);
			this.releaseService.deleteReleaseIfEmpty(deletedTrack.songId);
		} catch {
			throw new TrackNotFoundByIdException(trackId);
		}
	}
}
