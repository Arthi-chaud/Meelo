import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumNotFoundException, AlbumNotFoundFromIDException } from './album.exceptions';
import { AlbumType, Album, Prisma, Release } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlbumWhereInput, AlbumRelationInclude, AlbumsWhereInput } from './models/album.query-parameters';

@Injectable()
export class AlbumService {
	constructor(
		private prismaService: PrismaService,
		private artistServce: ArtistService
	) {}

	/**
	 * Find an album
	 * @param where the parameters to find the album
	 * @param include the relations to include
	 */
	async getAlbum(where: AlbumWhereInput, include?: AlbumRelationInclude) {
		try {
			return await this.prismaService.album.findFirst({
				rejectOnNotFound: true,
				where:{
					id: where.byId?.id ?? undefined,
					slug: where.bySlug?.slug.toString(),
					artist: where.bySlug ?
						where.bySlug.artistSlug ? {
							slug: where.bySlug?.artistSlug.toString()
						} : null
					: undefined
				},
				include: {
					releases: include?.releases ?? false,
					artist: include?.artist ?? false
				}
			});
		} catch {
			if (where.byId)
				throw new AlbumNotFoundFromIDException(where.byId.id);
			throw new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artistSlug);
		}
	}

	/**
	 * Find multiple albums
	 * @param where the parameters to find the album
	 * @param include the relations to include
	 */
	async getAlbums(where: AlbumsWhereInput, include?: AlbumRelationInclude) {
		return await this.prismaService.album.findMany({
			where: this.buildQueryParametersForMany(where),
			include: {
				releases: include?.releases ?? false,
				artist: include?.artist ?? false
			}
		});
	}

	/**
	 * Count the albums that match the query parameters
	 * @param where the query parameters
	 */
	async countAlbums(where: AlbumsWhereInput): Promise<number> {
		return await this.prismaService.album.count({
			where: this.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Build the query parameters for ORM, to select multiple rows
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	private buildQueryParametersForMany(where: AlbumsWhereInput) {
		return {
			artist: where.byArtist ?
				where.byArtist.artistSlug ? {
					slug: where.byArtist?.artistSlug.toString()
				} : null
			: undefined,
			slug: {
				startsWith: where.byName?.startsWith?.toString(),
				contains: where.byName?.contains?.toString()
			},
			releases: where.byLibrarySource ? {
				some: {
					tracks: {
						some: {
							sourceFile: {
								libraryId: where.byLibrarySource.libraryId
							}
						}
					}
				}
			} : undefined
		};
	}

	async updateAlbum(album: Album): Promise<Album> {
		return await this.prismaService.album.update({
			data: {
				...album,
				slug: new Slug(album.name).toString(),
				artist: undefined,
				releases: undefined
			},
			where: {
				id: album.id
			}
		});
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	 async updateAlbumDate(where: AlbumWhereInput): Promise<Album> {
		let album = (await this.getAlbum(where, { releases: true }));
		for (const release of album.releases) {
			if (album.releaseDate == null ||
				(release.releaseDate && release.releaseDate < album.releaseDate)) {
				album.releaseDate = release.releaseDate;
			}
		}
		return await this.updateAlbum(album);
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

	async createAlbum(albumName: string, artistName?: string, releaseDate?: Date, include?: Prisma.AlbumInclude) {
		let albumSlug: Slug = new Slug(albumName);

		if (artistName === undefined) {
			let albumExists: boolean = false;
			try {
				await this.getAlbum({ bySlug: { slug: albumSlug } });
				albumExists = true;
			} catch {}
			if (albumExists)
				throw new AlbumAlreadyExistsException(albumSlug);
		}
		try {
			return await this.prismaService.album.create({
				data: {
					name: albumName,
					slug: albumSlug.toString(),
					artistId: artistName ? (await this.artistServce.getOrCreateArtist(artistName!)).id : null,
					releaseDate: releaseDate,
					type: AlbumService.getAlbumTypeFromName(albumName)
				},
				include: {
					releases: include?.releases ?? false,
					artist: include?.artist ?? false
				}
			});
		} catch {
			throw new AlbumAlreadyExistsException(albumSlug, new Slug(artistName!));
		}

	}

	async findOrCreate(albumName: string, artistName?: string, include?: AlbumRelationInclude) {
		try {
			return await this.getAlbum(
				{ bySlug: { slug: new Slug(albumName), artistSlug: artistName ? new Slug(artistName) : undefined} },
				include
			);
		} catch {
			return await this.createAlbum(albumName, artistName, undefined, include);
		}
	}

	/**
	 * Deletes an album, and its related releases
	 * @param albumId 
	 */
	async deleteAlbum(albumId: number): Promise<void> {
		await this.prismaService.release.deleteMany({
			where: {
				albumId: albumId
			}
		});
		try {
			let deletedAlbum = await this.prismaService.album.delete({
				where: {
					id: albumId
				}
			});
			if (deletedAlbum.artistId !== null)
				this.artistServce.deleteArtistIfEmpty(deletedAlbum.artistId);
		} catch {
			throw new AlbumNotFoundFromIDException(albumId);
		}
	}

	/**
	 * Delete an artist if it does not have related song or album
	 * @param artistId 
	 */
	async deleteAlbumIfEmpty(artistId: number): Promise<void> {
		const songCount = await this.prismaService.song.count({
			where: {
				artistId: artistId
			}
		});
		const albumCount = await this.prismaService.album.count({
			where: {
				artistId: artistId
			}
		});
		if (songCount == 0 && albumCount == 0)
			await this.deleteAlbum(artistId);
	}
}
