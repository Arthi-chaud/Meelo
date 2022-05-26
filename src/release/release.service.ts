import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumNotFoundException } from 'src/album/album.exceptions';
import { Album } from 'src/album/models/album.model';
import { Artist } from 'src/artist/models/artist.model';
import { Slug } from 'src/slug/slug';
import { Release } from './models/release.model';
import { MasterReleaseNotFoundException } from './release.exceptions';

@Injectable()
export class ReleaseService {
	constructor(
		@InjectModel(Release)
		private releaseModel: typeof Release 
	) {}

	async getMasterReleaseOf(albumSlug: Slug, artistSlug: Slug): Promise<Release> {
		return await this.releaseModel.findOne({
			where: {
				master: true,
				'$Album.slug$': artistSlug.toString(),
				'$Album.Artist.slug$': artistSlug.toString()
			},
			rejectOnEmpty: true,
			include: [
				{
					model: Album,
					as: 'Album',
				},
				{
					model: Artist,
					as: 'Artist'
				}
			]
		}).catch(() => {
			throw new MasterReleaseNotFoundException(albumSlug, artistSlug);
		});
	}
}
