import { Injectable, Logger } from '@nestjs/common';
import { Slug } from 'src/slug/slug';
import { ArtistalreadyExistsException as ArtistAlreadyExistsException, ArtistNotFoundByIDException, ArtistNotFoundException } from './artist.exceptions';
import { Artist, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArtistQueryParameters } from './models/artist.query-parameters';
import { buildPaginationParameters, PaginationParameters } from 'src/utils/pagination';

@Injectable()
export class ArtistService {
	constructor(
		private prismaService: PrismaService
	) {}
	
	/**
	 * Creates an Artist
	 * @param artist the parameters needed to create an artist
	 * @param include the relation to include in the returned Artist
	 * @returns 
	 */
	async createArtist(artist: ArtistQueryParameters.CreateInput, include?: ArtistQueryParameters.RelationInclude) {
		const artistSlug = new Slug(artist.name);
		try {
			return await this.prismaService.artist.create({
				data: {
					name: artist.name,
					slug: artistSlug.toString()
				},
				include: ArtistQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw new ArtistAlreadyExistsException(artistSlug);
		}
	}

	/**
	 * Find an artist
	 * @param where the query parameters to find the artist
	 * @param include the relations to include in the returned artist
	 */
	async getArtist(where: ArtistQueryParameters.WhereInput, include?: ArtistQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.artist.findUnique({
				rejectOnNotFound: true,
				where: ArtistQueryParameters.buildQueryParameters(where),
				include: ArtistQueryParameters.buildIncludeParameters(include),
			});
		} catch {
			if (where.id !== undefined)
				throw new ArtistNotFoundByIDException(where.id);
			throw new ArtistNotFoundException(where.slug);
		};
	}

	/**
	 * Find multiple artist
	 * @param where the query parameters to find the artists
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include in the returned artists
	 */
	 async getArtists(where: ArtistQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: ArtistQueryParameters.RelationInclude) {
		return await this.prismaService.artist.findMany({
			where: ArtistQueryParameters.buildQueryParametersForMany(where),
			include: ArtistQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Count the artists that match the query parameters
	 * @param where the query parameters
	 */
	async countArtists(where: ArtistQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.artist.count({
			where: ArtistQueryParameters.buildQueryParametersForMany(where)
		}));
	}

	/**
	 * Updates an Artist
	 * @param what the fields to update
	 * @param where the query parameter to find the artist to update
	 * @returns the updated artist
	 */
	async updateArtist(what: ArtistQueryParameters.UpdateInput, where: ArtistQueryParameters.WhereInput): Promise<Artist> {
		try {
			return await this.prismaService.artist.update({
				data: {
					name: what.name,
					slug: what.name ? new Slug(what.name).toString() : undefined
				},
				where: ArtistQueryParameters.buildQueryParameters(where),
			});
		} catch {
			if (where.id !== undefined)
				throw new ArtistNotFoundByIDException(where.id);
			throw new ArtistNotFoundException(where.slug);
		}
	}

	/**
	 * Deletes an artist
	 * Also deletes related albums and songs
	 * @param where the query parameters to find the album to delete
	 */
	async deleteArtist(where: ArtistQueryParameters.WhereInput): Promise<void> {
		try {
			await this.prismaService.artist.delete({
				where: ArtistQueryParameters.buildQueryParameters(where)
			});
		} catch {
			if (where.id !== undefined)
				throw new ArtistNotFoundByIDException(where.id);
			throw new ArtistNotFoundException(where.slug);
		}
	}

	/**
	 * Deletes an artist if it does not have any album or song
	 * @param where the query parameters to find the artist to delete
	 */
	async deleteArtistIfEmpty(where: ArtistQueryParameters.WhereInput): Promise<void> {
		const albumCount = await this.prismaService.album.count({
			where: {
				artist: ArtistQueryParameters.buildQueryParameters(where)
			}
		});
		const songCount = await this.prismaService.song.count({
			where: {
				artist: ArtistQueryParameters.buildQueryParameters(where)
			}
		});
		if (songCount == 0 && albumCount == 0)
			await this.deleteArtist(where);
	}

	/**
	 * Find an artist by its name, or creates one if not found
	 * @param where the query parameters to find / create the artist
	 */
	 async getOrCreateArtist(where: ArtistQueryParameters.GetOrCreateInput, include?: ArtistQueryParameters.RelationInclude) {
		try {
			return await this.getArtist({ slug: new Slug(where.name) }, include);
		} catch {
			return await this.createArtist(where, include);
		}
	}
}
