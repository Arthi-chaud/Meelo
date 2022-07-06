import { Injectable } from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumAlreadyExistsExceptionWithArtistID as AlbumAlreadyExistsWithArtistIDException, AlbumNotFoundException, AlbumNotFoundFromIDException } from './album.exceptions';
import { AlbumType, Album } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import AlbumQueryParameters from './models/album.query-parameters';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import { buildPaginationParameters, PaginationParameters } from 'src/pagination/parameters';

@Injectable()
export default class AlbumService {
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
		if (album.artist === undefined) {
			if (await this.countAlbums({ byName: { is: album.name }}) != 0)
				throw new AlbumAlreadyExistsException(albumSlug);
		}
		try {
			return await this.prismaService.album.create({
				data: {
					name: album.name,
					artist: album.artist ? {
						connect: ArtistQueryParameters.buildQueryParametersForOne(album.artist)
					} : undefined,
					slug: albumSlug.toString(),
					releaseDate: album.releaseDate,
					type: AlbumService.getAlbumTypeFromName(album.name)
				},
				include: AlbumQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			if (album.artist)
				await this.artistServce.getArtist(album.artist);
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
				where: AlbumQueryParameters.buildQueryParametersForOne(where),
				include: AlbumQueryParameters.buildIncludeParameters(include),
			});
		} catch {
			if (where.byId)
				throw new AlbumNotFoundFromIDException(where.byId.id);
			throw new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artist?.slug);
		}
	}

	/**
	 * Find multiple albums
	 * @param where the parameters to find the album
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include
	 */
	async getAlbums(where: AlbumQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: AlbumQueryParameters.RelationInclude) {
		return await this.prismaService.album.findMany({
			where: AlbumQueryParameters.buildQueryParametersForMany(where),
			include: AlbumQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination)
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

	/**
	 * Updates an album in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the album to update
	 * @returns the updated album
	 */
	async updateAlbum(what: AlbumQueryParameters.UpdateInput,where: AlbumQueryParameters.WhereInput): Promise<Album> {
		return await this.prismaService.album.update({
			data: {
				...what,
				slug: what.name ? new Slug(what.name).toString() : undefined,
			},
			where: AlbumQueryParameters.buildQueryParametersForOne(where)
		});
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	 async updateAlbumDate(where: AlbumQueryParameters.WhereInput) {
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
				where: AlbumQueryParameters.buildQueryParametersForOne(where)
			});
			if (deletedAlbum.artistId !== null)
				this.artistServce.deleteArtistIfEmpty({ id: deletedAlbum.artistId });
		} catch {
			if (where.byId)
				throw new AlbumNotFoundFromIDException(where.byId.id);
			throw new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artist?.slug);
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

	/**
	 * Get an album, or create it if it does not exist
	 * @param where the query parameters to find / create he album
	 * @param include the relation fields to include in the returned album
	 * @returns 
	 */
	async getOrCreateAlbum(where: AlbumQueryParameters.GetOrCreateInput, include?: AlbumQueryParameters.RelationInclude) {
		try {
			return await this.getAlbum({
				bySlug: { slug: new Slug(where.name), artist: where.artist },
			}, include);
		} catch {
			return await this.createAlbum({...where}, include);
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
