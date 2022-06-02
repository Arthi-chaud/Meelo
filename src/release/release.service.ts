import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumService } from 'src/album/album.service';
import { Album } from 'src/album/models/album.model';
import { Artist } from 'src/artist/models/artist.model';
import { Slug } from 'src/slug/slug';
import { Track } from 'src/track/models/track.model';
import { Release } from './models/release.model';
import { MasterReleaseNotFoundException, ReleaseAlreadyExists, ReleaseNotFoundException } from './release.exceptions';

@Injectable()
export class ReleaseService {
	constructor(
		@InjectModel(Release)
		private releaseModel: typeof Release,
		private albumService: AlbumService,
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
	
	async saveRelease(release: Release): Promise<Release> {
		return await release.save();
	}

	async findOrCreateRelease(releaseTitle: string, albumName: string, artistName?: string): Promise<Release> {
		try {
			return await this.findRelease(releaseTitle, new Slug(albumName), artistName ? new Slug(artistName) : undefined);
		} catch {
			try {
				let album: Album = await this.albumService.findOrCreate(albumName, artistName);
				Logger.error(album.toJSON());
				Logger.error(album.releases);
				return await this.createRelease(releaseTitle, album, []);
			} catch (e) {
				Logger.warn(e);
				throw e;
			}
		}
	}


	async createRelease(releaseTitle: string, album: Album, tracks: Track[]): Promise<Release> {
		try {
			return await this.releaseModel.create({
				album: album,
				master: album.releases.filter((release) => release.master).length == 0,
				title: releaseTitle,
				tracks: tracks
			});
		} catch {
			throw new ReleaseAlreadyExists(releaseTitle, album.artist ? new Slug(album.artist!.slug!) : undefined);
		}
	}
	
	async findRelease(releaseTitle: string, albumSlug: Slug, artistSlug?: Slug): Promise<Release> {
		try {
			return await this.releaseModel.findOne({
				rejectOnEmpty: true,
				where: {
					title: releaseTitle,
					'$Album.Artist.slug$': artistSlug?.toString(),
					'$Album.slug$': albumSlug.toString()
				},
				include: [
					{
						model: Artist,
						as: 'Artist',
					},
					{
						model: Album,
						as: 'Artist',
					},
				]
			});
		} catch {
			throw new ReleaseNotFoundException(releaseTitle, albumSlug, artistSlug);
		}
	}
}
