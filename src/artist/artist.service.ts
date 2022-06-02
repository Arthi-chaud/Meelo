import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Slug } from 'src/slug/slug';
import { ArtistNotFoundException } from './artist.exceptions';
import { Artist } from './models/artist.model';

@Injectable()
export class ArtistService {
	constructor(
		@InjectModel(Artist)
		private artistModel: typeof Artist
	) {}
	/**
	 * Find an artist by its slug
	 * @param artistSlug the slug of the artist to find
	 */
	async getArtist(artistSlug: Slug): Promise<Artist> {
		return await this.artistModel.findOne({
			rejectOnEmpty: true,
			where: {
				slug: artistSlug.toString()
			}
		}).catch(() => {
			throw new ArtistNotFoundException(artistSlug);
		});
	}

	async createArtist(artistName: string): Promise<Artist> {
		let artistSlug: Slug = new Slug(artistName);
		return await this.artistModel.create({
			albums: [],
			name: artistName,
			slug: artistSlug.toString(),
		});
	}

	/**
	 * Find an artist by its name, or creates one if not found
	 * @param artistName the slug of the artist to find
	 */
	 async getOrCreateArtist(artistName: string): Promise<Artist> {
		try {
			return await this.getArtist(new Slug(artistName));
		} catch {
			return await this.createArtist(artistName);
		}
	}
}
