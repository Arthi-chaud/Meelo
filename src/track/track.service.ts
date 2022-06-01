import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Track } from './models/track.model';

@Injectable()
export class TrackService {
	constructor(
		@InjectModel(Track)
		private trackModel: typeof Track,
	) {}

	/**
	 * Saves a Track in the database
	 * @param track the track instance to save
	 * @returns the track once saved
	 */
	async saveTrack(track: Track): Promise<Track> {
		return await track.save();
	}
}
