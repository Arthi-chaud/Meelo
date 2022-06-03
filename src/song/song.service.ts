import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { Song, Artist } from '@prisma/client';
import { SongAlreadyExistsException, SongNotFoundException } from './song.exceptions';
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
	async findSong(artistSlug: Slug, titleSlug: Slug): Promise<Song> {
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
					artist: true,
					instances: true
				}
			});
		} catch {
			throw new SongNotFoundException(titleSlug, artistSlug);
		}
	}
	
	async createSong(artistName: string, title: string): Promise<Song> {
		try {
			let artist: Artist = await this.artistService.getOrCreateArtist(artistName);
			return await this.prismaService.song.create({
				data: {
					artistId: artist.id,
					playCount: 0,
					name: title,
					slug: new Slug(title).toString()
				}
			});
		} catch {
			throw new SongAlreadyExistsException(new Slug(artistName), new Slug(title));
		}
	}
	
	async findOrCreateSong(artistName: string, title: string): Promise<Song> {
		try {
			return await this.findSong(new Slug(artistName), new Slug(title));
		} catch {
			return await this.createSong(artistName, title);
		}
	}
}
