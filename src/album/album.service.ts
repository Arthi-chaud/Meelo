import { GoneException, Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumNotFoundException, AlbumNotFoundFromIDException } from './album.exceptions';
import { AlbumType, Album, Prisma, Release } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlbumWhereInput } from './models/album.query-parameters';

@Injectable()
export class AlbumService {
	constructor(
		private prismaService: PrismaService,
		private artistServce: ArtistService
	) {}

	/**
	 * Find an album from its slug and its artist's slug
	 * @param where the parameters to find the album
	 * @param include the relations to include
	 */
	async getAlbum(where: AlbumWhereInput, include?: Prisma.AlbumInclude) {
		try {
			return await this.prismaService.album.findFirst({
				rejectOnNotFound: true,
				where: where.byId ? 
					{ id: where.byId.id }
				: {
					slug: where.bySlug.slug.toString(),
					artist: where.bySlug.artistSlug ? {
						slug: where.bySlug.artistSlug.toString()
					} : null
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
	 * Retrieves the release related to an album
	 * @param albumId the id of the parent album
	 * @param include the relation to include in the retrived objects
	 * @returns a promise of an array of releases
	 */
	async getAlbumReleases(albumId: number, include?: Prisma.ReleaseInclude): Promise<Release[]> {
		return await this.prismaService.release.findMany({
			where: {
				albumId: {
					equals: albumId
				}
			},
			include: {
				album: false,
				tracks: include?.tracks ?? false
			}
		});
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
	 * @param album 
	 */
	 async updateAlbumDate(album: Album): Promise<Album> {
		let releases: Release[] = await this.getAlbumReleases(album.id);
		for (const release of releases) {
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

	async findOrCreate(albumName: string, artistName?: string, include?: Prisma.AlbumInclude) {
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
