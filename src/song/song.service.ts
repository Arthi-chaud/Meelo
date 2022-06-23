import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { type Song, type Artist, Prisma } from '@prisma/client';
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from './song.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SongService {
	constructor(
		private prismaService: PrismaService,
		private artistService: ArtistService,
	) {}

	/**
	 * Finds a song in the database from its name slug and artist's slug
	 * @param artistSlug slug of the artist of the song
	 * @param titleSlug the slug of the title of the song
	 */
	async getSong(artistSlug: Slug, titleSlug: Slug, include?: Prisma.SongInclude) {
		try {
			return await this.prismaService.song.findFirst({
				rejectOnNotFound: true,
				where: {
					slug: {
						equals: titleSlug.toString()
					},
					artist: {
						slug: {
							equals: artistSlug.toString()
						}
					}
				},
				include: {
					artist: include?.artist ?? false,
					instances: include?.instances ?? false
				}
			});
		} catch {
			throw new SongNotFoundException(titleSlug, artistSlug);
		}
	}

	/**
	 * Retrives a song from the database using its id
	 * @param songId 
	 * @param include 
	 * @returns the fetched song
	 */
	async getSongById(songId: number, include?: Prisma.SongInclude) {
		try {
			return await this.prismaService.song.findUnique({
				rejectOnNotFound: true,
				where: {
					id: songId
				},
				include: {
					artist: include?.artist ?? false,
					instances: include?.instances ?? false
				}
			});
		} catch {
			throw new SongNotFoundByIdException(songId);
		}
	}
	
	async createSong(artistName: string, title: string, include?: Prisma.SongInclude) {
		try {
			let artist: Artist = await this.artistService.getOrCreateArtist(artistName);
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
	
	async findOrCreateSong(artistName: string, title: string, include?: Prisma.SongInclude) {
		try {
			return await this.getSong(new Slug(artistName), new Slug(title), include);
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
				this.artistService.deleteArtistIfEmpty(deletedSong.artistId);
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
