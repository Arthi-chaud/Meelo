import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArtistService } from 'src/artist/artist.service';
import { Artist } from 'src/artist/models/artist.model';
import { Release } from 'src/release/models/release.model';
import { Slug } from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumNotFoundException } from './album.exceptions';
import { Album } from './models/album.model';

@Injectable()
export class AlbumService {
	constructor(
		@InjectModel(Album)
		private albumModel: typeof Album,
		private artistServce: ArtistService
	) {}

	/**
	 * Find an album from its slug and its artist's slug
	 * @param albumSlug the slug of the album to find
	 * @param artistSlug the slug of the artist of the album
	 */
	async getAlbumBySlug(albumSlug: Slug, artistSlug?: Slug): Promise<Album> {
		return await this.albumModel.findOne({
			where: {
				slug: albumSlug.toString(),
				'$Artist.slug$': artistSlug?.toString()
			},
			rejectOnEmpty: true,
			include: [
				{
					model: Artist,
					as: 'Artist',
				},
				Release
			]
		}).catch(() => {
			throw new AlbumNotFoundException(albumSlug, artistSlug);
		});
	}

	async saveAlbum(album: Album): Promise<Album> {
		return await album.save();
	}

	getAlbumTypeFromName(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.search(/.+(live).*/g) ||
			albumName.includes(' tour')) {
			return AlbumType.LiveRecording
		}
		if (albumName.endsWith('- single')) {
			return AlbumType.Single
		}
		if (albumName.includes('best of')) {
			return AlbumType.Compilation
		}
		return AlbumType.StudioRecording;
	}

	async createAlbum(albumName: string, artistName?: string, releaseDate?: Date): Promise<Album> {
		let albumSlug: Slug = new Slug(albumName);
		try {
			let album: Album = Album.build({
				name: albumName,
				slug: albumSlug,
				artist: artistName ? await this.artistServce.getOrCreateArtist(artistName) : null,
				releaseDate: releaseDate,
				releases: [],
				type: this.getAlbumTypeFromName(albumName)
			});
			return await album.save();
		} catch {
			throw new AlbumAlreadyExistsException(albumSlug, new Slug(artistName ?? 'Unkown'));
		}

	}

	async findOrCreate(albumName: string, artistName?: string): Promise<Album> {
		try {
			return await this.getAlbumBySlug(new Slug(albumName), artistName ? new Slug(artistName) : undefined);
		} catch {
			return await this.createAlbum(albumName, artistName);
		}
	}
}
