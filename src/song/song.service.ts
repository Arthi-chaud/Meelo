import { forwardRef, Inject, Injectable } from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import type { Artist, Song, Track } from '@prisma/client';
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from './song.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import SongQueryParameters from './models/song.query-params';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import { SongController } from './song.controller';
import { UrlGeneratorService } from 'nestjs-url-generator';
import TrackService from 'src/track/track.service';

@Injectable()
export default class SongService {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	/**
	 * Create a Song, and saves it in the database
	 * @param song the parameters to build the song
	 * @param include the relation fields to include in the returned object
	 * @returns the created song
	 */
	async createSong(song: SongQueryParameters.CreateInput, include?: SongQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.song.create({
				data: {
					artist: {
						connect: ArtistQueryParameters.buildQueryParametersForOne(song.artist)
					},
					playCount: 0,
					name: song.name,
					slug: new Slug(song.name).toString()
				},
				include: SongQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			let artist = await this.artistService.getArtist(song.artist);
			throw new SongAlreadyExistsException(new Slug(song.name), new Slug(artist.name));
		}
	}

	/**
	 * Finds a song in the database
	 * @param where the query parameters to find the song
	 * @param include the relations to include in the returned value
	 */
	async getSong(where: SongQueryParameters.WhereInput, include?: SongQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.song.findFirst({
				rejectOnNotFound: true,
				where: SongQueryParameters.buildQueryParametersForOne(where),
				include: SongQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			if (where.byId)
				throw new SongNotFoundByIdException(where.byId.id);
			const artist = await this.artistService.getArtist(where.bySlug.artist)
			throw new SongNotFoundException(where.bySlug.slug, new Slug(artist.slug));
		}
	}
	/**
	 * Find multiple songs
	 * @param where the parameters to find the songs
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include
	 */
	async getSongs(where: SongQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: SongQueryParameters.RelationInclude) {
		return await this.prismaService.song.findMany({
			where: SongQueryParameters.buildQueryParametersForMany(where),
			include: SongQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination) 
		});
	}

	/**
	 * Count the songs that match the query parametets
	 * @param where the query parameters
	 * @returns the number of match
	 */
	async countSongs(where: SongQueryParameters.ManyWhereInput): Promise<number> {
		return await this.prismaService.song.count({
			where: SongQueryParameters.buildQueryParametersForMany(where)
		});
	}
	
	/**
	 * Updates a song in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the album to update
	 * @returns the updated album
	 */
	async updateSong(what: SongQueryParameters.UpdateInput, where: SongQueryParameters.UpdateWhereInput): Promise<Song> {
		try {
			return await this.prismaService.song.update({
				data: {
					...what,
					artist: what.artist ? {
						connect: ArtistQueryParameters.buildQueryParametersForOne(what.artist),
					} : undefined,
				},
				where: {
					id: where.byId?.id,
					slug_artistId: where.bySlug ? {
						slug: where.bySlug.slug.toString(),
						artistId: where.bySlug.artistId,
					} : undefined
				}
			});
		} catch {
			if (where.byId !== undefined)
				throw new SongNotFoundByIdException(where.byId.id);
			let artist = await this.artistService.getArtist({ id: where.bySlug.artistId });
			throw new SongNotFoundException(where.bySlug.slug, new Slug(artist.name));
		}
	}
	
	/**
	 * Deletes a song
	 * @param where Query parameters to find the song to delete 
	 */
	async deleteSong(where: SongQueryParameters.WhereInput): Promise<void> {
		let song = await this.getSong(where);
		try {
			let deletedSong = await this.prismaService.song.delete({
				where: SongQueryParameters.buildQueryParametersForOne({ byId: { id: song.id } })
			});
			await this.artistService.deleteArtistIfEmpty({ id: deletedSong.artistId });
		} catch {
			if (where.byId)
				throw new SongNotFoundByIdException(where.byId.id);
			const artist = await this.artistService.getArtist(where.bySlug.artist)
			throw new SongNotFoundException(where.bySlug.slug, new Slug(artist.slug));
		}
	}
	
	/**
	 * Deletes a song if it does not have related tracks
	 */
	async deleteSongIfEmpty(where: SongQueryParameters.WhereInput): Promise<void> {
		const trackCount = await this.prismaService.track.count({
			where: {
				song: SongQueryParameters.buildQueryParametersForOne(where)
			}
		});
		if (trackCount == 0)
			await this.deleteSong(where);
	}
	/**
	 * Finds a song, or creates one if it does not exist already
	 * @param where where the query parameters to fond or create the release
	 * @returns the fetched or createdrelease
	 */
	async getOrCreateSong(where: SongQueryParameters.GetOrCreateInput, include?: SongQueryParameters.RelationInclude) {
		try {
			return await this.getSong(
				{ bySlug: { slug: new Slug(where.name), artist: where.artist}},
				include
			);
		} catch {
			return await this.createSong(where, include);
		}
	}

	buildSongResponse(song: Song & Partial<{ instances: Track[], artist: Artist }>): Object {
		let response: Object = {
			...song,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: SongController,
				controllerMethod: SongController.prototype.getSongIllustration,
				params: {
					id: song.id.toString()
				}
			})
		};
		if (song.instances !== undefined)
			response = {
				...response,
				instances: song.instances.map(
					(track) => this.trackService.buildTrackResponse(track)
				)
			}
		if (song.artist !== undefined)
			response = {
				...response,
				artist: this.artistService.buildArtistResponse(song.artist)
			}
		return response;
	}
}
