import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { type Song, type Artist, Prisma } from '@prisma/client';
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from './song.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { SongRelationInclude, SongsWhereInput, SongWhereInput } from './models/song.query-params';

@Injectable()
export class SongService {
	constructor(
		private prismaService: PrismaService,
		private artistService: ArtistService,
	) {}

	/**
	 * Finds a song in the database
	 * @param where the query parameters to find the song
	 * @param include the relations to include in the returned value
	 */
	async getSong(where: SongWhereInput, include?: SongRelationInclude) {
		try {
			return await this.prismaService.song.findFirst({
				rejectOnNotFound: true,
				where: {
					id: where.byId?.id,
					slug: where.bySlug?.slug.toString(),
					artist: where.bySlug ? {
						slug: where.bySlug.artistSlug.toString()
					} : undefined
				},
				include: {
					artist: include?.artist ?? false,
					instances: include?.instances ?? false
				}
			});
		} catch {
			if (where.byId)
				throw new SongNotFoundByIdException(where.byId.id);
			throw new SongNotFoundException(where.bySlug.slug, where.bySlug.artistSlug);
		}
	}
	
	async getSongs(where: SongsWhereInput, include?: SongRelationInclude) {
		return await this.prismaService.song.findMany({
			where: this.buildQueryParametersForMany(where),
			include: {
				artist: include?.artist ?? false,
				instances: include?.instances ?? false
			}
		});
	}

	private buildQueryParametersForMany(where: SongsWhereInput) {
		return {
			artistId: where.byArtist?.artistId,
			artist: where.byArtist?.artistSlug ? {
				slug: where.byArtist.artistSlug.toString()
			} : undefined,
			slug: {
				startsWith: where.byName?.startsWith?.toString(),
				contains: where.byName?.contains?.toString(),
				equals: where.byName?.exact?.toString(),
			},
			playCount: {
				equals: where.byPlayCount?.exact,
				gt: where.byPlayCount?.moreThan,
				lt: where.byPlayCount?.below
			}
		};
	}

	/**
	 * Count the songs that match the query parametets
	 * @param where the query parameters
	 * @returns the number of match
	 */
	async countSongs(where: SongsWhereInput): Promise<number> {
		return await this.prismaService.song.count({
			where: this.buildQueryParametersForMany(where)
		});
	}
	
	async createSong(artistName: string, title: string, include?: Prisma.SongInclude) {
		try {
			let artist: Artist = await this.artistService.getOrCreateArtist({ name: artistName });
			return await this.prismaService.song.create({
				data: {
					artistId: artist.id,
					playCount: 0,
					name: title,
					slug: new Slug(title).toString()
				},
				include: {
					instances: include?.instances ?? false,
					artist: include?.artist ?? false
				}
			});
		} catch {
			throw new SongAlreadyExistsException(new Slug(title), new Slug(artistName));
		}
	}
	
	async findOrCreateSong(artistName: string, title: string, include?: SongRelationInclude) {
		try {
			return await this.getSong(
				{ bySlug: {slug: new Slug(artistName), artistSlug: new Slug(title)}},
				include
			);
		} catch {
			return await this.createSong(artistName, title, include);
		}
	}

	/**
	 * Deletes a song using its ID
	 * Also delete related tracks.
	 * @param songId 
	 */
	async deleteSong(songId: number): Promise<void> {
		try {
			let deletedSong = await this.prismaService.song.delete({
				where: {
					id: songId
				}
			});
			if (deletedSong.artistId !== null)
				this.artistService.deleteArtistIfEmpty({ id: deletedSong.artistId });
		} catch {
			throw new SongNotFoundByIdException(songId);
		}
	}

	/**
	 * Deletes a song if it does not have related tracks
	 * @param songId 
	 */
	async deleteSongIfEmpty(songId: number): Promise<void> {
		const trackCount = await this.prismaService.track.count({
			where: {
				songId: songId
			}
		});
		if (trackCount == 0)
			await this.deleteSong(songId);
	}
}
