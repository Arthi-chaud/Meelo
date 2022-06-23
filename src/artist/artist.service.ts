import { Injectable, Logger } from '@nestjs/common';
import { Slug } from 'src/slug/slug';
import { ArtistalreadyExistsException, ArtistNotFoundByIDException, ArtistNotFoundException } from './artist.exceptions';
import { Artist, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArtistService {
	constructor(
		private prismaService: PrismaService
	) {}
	/**
	 * Find an artist by its slug
	 * @param artistSlug the slug of the artist to find
	 */
	async getArtist(artistSlug: Slug, include?: Prisma.ArtistInclude) {
		try {
			return await this.prismaService.artist.findUnique({
				rejectOnNotFound: true,
				where: {
					slug: artistSlug.toString()
				},
				include: {
					albums: include?.albums ?? false,
					songs: include?.songs ?? false
				}
			});
		} catch {
			throw new ArtistNotFoundException(artistSlug);
		};
	}

	/**
	 * Find an artist by its id
	 * @param artistId the id of the artist to find
	 */
	 async getArtistById(artistId: number, include?: Prisma.ArtistInclude) {
		try {
			return await this.prismaService.artist.findUnique({
				rejectOnNotFound: true,
				where: {
					id: artistId
				},
				include: {
					albums: include?.albums ?? false,
					songs: include?.songs ?? false
				}
			});
		} catch {
			throw new ArtistNotFoundByIDException(artistId);
		};
	}

	async getAllArtists(include?: Prisma.ArtistInclude) {
		return await this.prismaService.artist.findMany({
			include: {
				albums: include?.albums ?? false,
				songs: include?.songs ?? false
			}
		});
	}

	async createArtist(artistName: string, include?: Prisma.ArtistInclude) {
		let artistSlug: Slug = new Slug(artistName);
		try {
			return await this.prismaService.artist.create({
				data: {
					name: artistName,
					slug: artistSlug.toString(),
				},
				include: {
					albums: include?.albums ?? false,
					songs: include?.songs ?? false
				}
			});
		} catch {
			throw new ArtistalreadyExistsException(artistSlug);
		}
	}

	/**
	 * Find an artist by its name, or creates one if not found
	 * @param artistName the slug of the artist to find
	 */
	async getOrCreateArtist(artistName: string, include?: Prisma.ArtistInclude) {
		try {
			return await this.getArtist(new Slug(artistName), include);
		} catch {
			return await this.createArtist(artistName, include);
		}
	}

	/**
	 * Deletes an artist
	 * Also deletes related albums and songs
	 * @param artistId 
	 */
	async deleteArtist(artistId: number): Promise<void> {
		await this.prismaService.album.deleteMany({
			where: {
				artistId: artistId
			}
		});
		await this.prismaService.song.deleteMany({
			where: {
				artistId: artistId
			}
		});
		try {
			await this.prismaService.artist.delete({
				where: {
					id: artistId
				}
			});
		} catch {
			throw new ArtistNotFoundByIDException(artistId);
		}
	}

	/**
	 * Deletes an artist if it does not have any album or song
	 * @param artistId the id of the artist to delete, if empty
	 */
	async deleteArtistIfEmpty(artistId: number): Promise<void> {
		const albumCount = await this.prismaService.album.count({
			where: {
				artistId: artistId
			}
		});
		const songCount = await this.prismaService.song.count({
			where: {
				artistId: artistId
			}
		});
		if (songCount == 0 && albumCount == 0)
			await this.deleteArtist(artistId);
	}
}
