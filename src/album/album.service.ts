import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumAlreadyExistsExceptionWithArtistID as AlbumAlreadyExistsWithArtistIDException, AlbumNotFoundException, AlbumNotFoundFromIDException } from './album.exceptions';
import { AlbumType, Album, Prisma, Release } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlbumQueryParameters } from './models/album.query-parameters'; './models/album.query-parameters';

@Injectable()
export class AlbumService {
	constructor(
		private prismaService: PrismaService,
		private artistServce: ArtistService
	) {}


	/**
	 * Create an Album, and saves it in the database
	 * @param album the album object to save
	 * @param include the relation to include in the returned value
	 * @returns the saved Album
	 */
	async createAlbum(album: AlbumQueryParameters.CreateInput, include?: AlbumQueryParameters.RelationInclude) {
		const albumSlug = new Slug(album.name);
		try {
			return await this.prismaService.album.create({
				data: {
					name: album.name,
					artist: album.artist ? {
						connect: {
							id: album.artist.id,
							slug: album.artist.slug?.toString()
						}
					} : undefined,
					slug: albumSlug.toString(),
					type: AlbumService.getAlbumTypeFromName(album.name)
				},
				include: AlbumQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			if (album.artist?.id)
				throw new AlbumAlreadyExistsWithArtistIDException(albumSlug, album.artist.id);
			throw new AlbumAlreadyExistsException(albumSlug, album.artist?.slug);
		}
	}

	/**
	 * Find an album
	 * @param where the parameters to find the album
	 * @param include the relations to include
	 */
	async getAlbum(where: AlbumQueryParameters.WhereInput, include?: AlbumQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.album.findFirst({
				rejectOnNotFound: true,
				where: AlbumQueryParameters.buildQueryParameterForOne(where),
				include: AlbumQueryParameters.buildIncludeParameters(include),
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
	async getAlbums(where: AlbumQueryParameters.ManyWhereInput, include?: AlbumQueryParameters.RelationInclude) {
		return await this.prismaService.album.findMany({
			where: AlbumQueryParameters.buildQueryParametersForMany(where),
			include: AlbumQueryParameters.buildIncludeParameters(include)
		});
	}

	/**
	 * Count the albums that match the query parameters
	 * @param where the query parameters
	 */
	async countAlbums(where: AlbumQueryParameters.ManyWhereInput): Promise<number> {
		return await this.prismaService.album.count({
			where: AlbumQueryParameters.buildQueryParametersForMany(where)
		});
	}

	async updateAlbum(what: AlbumQueryParameters.UpdateInput,where: AlbumQueryParameters.WhereInput): Promise<Album> {
		return await this.prismaService.album.update({
			data: {
				...what,
				slug: what.name ? new Slug(what.name).toString() : undefined,
			},
			where: AlbumQueryParameters.buildQueryParameterForOne(where)
		});
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	 async updateAlbumDate(where: AlbumQueryParameters.WhereInput): Promise<Album> {
		let album = (await this.getAlbum(where, { releases: true }));
		for (const release of album.releases) {
			if (album.releaseDate == null ||
				(release.releaseDate && release.releaseDate < album.releaseDate)) {
				album.releaseDate = release.releaseDate;
			}
		}
		return await this.updateAlbum({ releaseDate: album.releaseDate }, { byId: { id: album.id }});
	}

	/**
	 * Deletes an album, and its related releases
	 * @param where the query parameter 
	 */
	async deleteAlbum(where: AlbumQueryParameters.WhereInput): Promise<void> {
		try {
			let deletedAlbum = await this.prismaService.album.delete({
				where: AlbumQueryParameters.buildQueryParameterForOne(where)
			});
			if (deletedAlbum.artistId !== null)
				this.artistServce.deleteArtistIfEmpty(deletedAlbum.artistId);
		} catch {
			if (where.byId)
				throw new AlbumNotFoundFromIDException(where.byId.id);
			throw new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artistSlug);
		}
	}

	/**
	 * Delete an album if it does not have related releases
	 * @param albumId 
	 */
	async deleteAlbumIfEmpty(albumId: number): Promise<void> {
		const albumCount = await this.prismaService.release.count({
			where: { albumId: albumId }
		});
		if (albumCount == 0)
			await this.deleteAlbum({ byId: { id: albumId } });
	}

	async findOrCreate(where: AlbumQueryParameters.FindOrCreateInput,include?: AlbumQueryParameters.RelationInclude) {
		const artistSlug = where.artistName ? new Slug(where.artistName) : undefined
		try {
			return await this.getAlbum(
				{
					bySlug: { slug: new Slug(where.name), artistSlug: artistSlug },
				},
				include
			);
		} catch {
			return await this.createAlbum({
				name: where.name,
				releaseDate: where.releaseDate,
				artist: { slug: artistSlug },
			}, include);
		}
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
}
