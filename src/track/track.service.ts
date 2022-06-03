import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Track } from '@prisma/client';

@Injectable()
export class TrackService {
	constructor(
		private prismaService: PrismaService
	) {}

	/**
	 * Saves a Track in the database
	 * @param track the track instance to save
	 * @returns the track once saved
	 */
	async createTrack(track: Prisma.TrackCreateInput): Promise<Track> {
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
}
