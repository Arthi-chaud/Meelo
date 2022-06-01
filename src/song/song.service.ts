import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArtistService } from 'src/artist/artist.service';
import { Artist } from 'src/artist/models/artist.model';
import { Slug } from 'src/slug/slug';
import { Track } from 'src/track/models/track.model';
import { Song } from './models/song.model';
import { SongAlreadyExistsException, SongNotFoundException } from './song.exceptions';

@Injectable()
export class SongService {
	constructor(
		@InjectModel(Song)
		private songModel: typeof Song,
		private artistService: ArtistService,
	) {}

	/**
	 * Finds a song in the database from its name slug and artist's slug
	 * @param artistSlug slug of the artist of the song
	 * @param titleSlug the slug of the title of the song
	 */
	async findSong(artistSlug: Slug, titleSlug: Slug): Promise<Song> {
		try {
			return await this.songModel.findOne({
				where: {
					slug: titleSlug,
					'$Artist.slug$': artistSlug.toString()
				},
				rejectOnEmpty: true,
				include: [
					{
						model: Artist,
						as: 'Artist'
					},
					{
						model: Track,
					}
				]
			});
		} catch {
			throw new SongNotFoundException(titleSlug, artistSlug);
		}
	}
	
	async createSong(artistName: string, title: string): Promise<Song> {
		try {
			let artist: Artist = await this.artistService.getOrCreateArtist(artistName);
			return await this.songModel.create({
				artist: artist,
				instances: [],
				playCount: 0,
				name: title,
				slug: new Slug(title).toString()
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
