import { Injectable } from '@nestjs/common';
import { Slug } from 'src/slug/slug';
import { ArtistalreadyExistsException, ArtistNotFoundException } from './artist.exceptions';
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
					albums: include?.albums,
					songs: include?.songs
				}
			});
		} catch {
			throw new ArtistNotFoundException(artistSlug);
		};
	}

	async getAllArtists(include?: Prisma.ArtistInclude) {
		return await this.prismaService.artist.findMany({
			include: {
				albums: include?.albums,
				songs: include?.songs
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
					albums: include?.albums,
					songs: include?.songs
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
}
