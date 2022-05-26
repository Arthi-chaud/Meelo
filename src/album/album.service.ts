import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Artist } from 'src/artist/models/artist.model';
import { Release } from 'src/release/models/release.model';
import { Slug } from 'src/slug/slug';
import { AlbumNotFoundException } from './album.exceptions';
import { Album } from './models/album.model';

@Injectable()
export class AlbumService {
	constructor(
		@InjectModel(Album)
		private albumModel: typeof Album 
	) {}

	/**
	 * Find an album from its slug and its artist's slug
	 * @param albumSlug the slug of the album to find
	 * @param artistSlug the slug of the artist of the album
	 */
	async getAlbumBySlug(albumSlug: Slug, artistSlug: Slug): Promise<Album> {
		return await this.albumModel.findOne({
			where: {
				slug: albumSlug.toString(),
				'$Artist.slug$': artistSlug.toString()
			},
			rejectOnEmpty: true,
			include: [
				{
					model: Artist,
					as: 'Artist',
				},
			]
		}).catch(() => {
			throw new AlbumNotFoundException(albumSlug, artistSlug);
		});
	}
}
