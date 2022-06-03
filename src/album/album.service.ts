import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumNotFoundException } from './album.exceptions';
import { AlbumType, Album, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AlbumService {
	constructor(
		private prismaService: PrismaService,
		private artistServce: ArtistService
	) {}

	/**
	 * Find an album from its slug and its artist's slug
	 * @param albumSlug the slug of the album to find
	 * @param artistSlug the slug of the artist of the album
	 */
	async getAlbumBySlug(albumSlug: Slug, artistSlug?: Slug, include?: Prisma.AlbumInclude): Promise<Album> {
		try {
			return await this.prismaService.album.findFirst({
				rejectOnNotFound: true,
				where: {
					slug: {
						equals: albumSlug.toString()
					},
					artist: {
						slug: {
							equals: artistSlug?.toString()
						}
					}
				},
				include: include
			})
		} catch {
			throw new AlbumNotFoundException(albumSlug, artistSlug);
		}
	}

	async saveAlbum(album: Album): Promise<Album> {
		return await this.prismaService.album.create({
			data: {
				...album,
				slug: new Slug(album.name).toString()
			}
		});
	}

	static getAlbumTypeFromName(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.search(/.+(live).*/g) != -1 ||
			albumName.includes(' tour')) {
			return AlbumType.LiveRecording
		}
		if (albumName.endsWith('- single') ||
			albumName.endsWith('(remixes)')) {
			return AlbumType.Single
		}
		if (albumName.includes('best of') ||
			albumName.includes('best mixes')) {
			return AlbumType.Compilation
		}
		return AlbumType.StudioRecording;
	}

	async createAlbum(albumName: string, artistName?: string, releaseDate?: Date): Promise<Album> {
		let albumSlug: Slug = new Slug(albumName);
		try {
			return await this.prismaService.album.create({
				data: {
					name: albumName,
					slug: albumSlug.toString(),
					artistId: artistName ? (await this.artistServce.getOrCreateArtist(artistName!)).id! : null,
					releaseDate: releaseDate,
					type: AlbumService.getAlbumTypeFromName(albumName)
				}
			});
		} catch (e) {
			Logger.error("Shite");
			throw new AlbumAlreadyExistsException(albumSlug, artistName ? new Slug(artistName) : undefined);
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
