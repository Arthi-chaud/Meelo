import { Injectable, Logger } from '@nestjs/common';
import { Slug } from 'src/slug/slug';
import { ArtistalreadyExistsException, ArtistNotFoundByIDException, ArtistNotFoundException } from './artist.exceptions';
import { Artist, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArtistRelationInclude, ArtistsWhereInput, ArtistWhereInput } from './models/artist.query-parameters';

@Injectable()
export class ArtistService {
	constructor(
		private prismaService: PrismaService
	) {}
	
	/**
	 * Find an artist
	 * @param where the query parameters to find the artist
	 * @param include the relations to include in the returned artist
	 */
	async getArtist(where: ArtistWhereInput, include?: ArtistRelationInclude) {
		try {
			return await this.prismaService.artist.findUnique({
				rejectOnNotFound: true,
				where: {
					id: where.byId?.id,
					slug: where.bySlug?.slug.toString()
				},
				include: {
					albums: include?.albums ?? false,
					songs: include?.songs ?? false
				}
			});
		} catch {
			if (where.byId)
				throw new ArtistNotFoundByIDException(where.byId.id);
			throw new ArtistNotFoundException(where.bySlug.slug);
		};
	}

	/**
	 * Find multiple artist
	 * @param where the query parameters to find the artists
	 * @param include the relations to include in the returned artists
	 */
	 async getArtists(where: ArtistsWhereInput, include?: ArtistRelationInclude) {
		return await this.prismaService.artist.findMany({
			where: {
				slug: {
					startsWith: where.bySlug?.startsWith?.toString(),
					contains: where.bySlug?.contains?.toString(),
				},
				albums: where.byLibrarySource ? {
					some: {
						releases: {
							some: {
								tracks: {
									some: {
										sourceFile: { libraryId: where.byLibrarySource.libraryId }
									}
								}
							}
						}
					}
				} : undefined
			},
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
	async getOrCreateArtist(artistName: string, include?: ArtistRelationInclude) {
		try {
			return await this.getArtist(
				{ bySlug: { slug: new Slug(artistName) }},
				include
			);
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
