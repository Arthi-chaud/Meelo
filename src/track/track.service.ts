import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Track } from '@prisma/client';

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
	async saveTrack(track: Track): Promise<Track> {
		return await this.prismaService.track.create({
			data: {...track}
		});
	}
}
