import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import type { Artist, Song, Track } from '@prisma/client';
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from './song.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import SongQueryParameters from './models/song.query-params';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import TrackService from 'src/track/track.service';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';
import GenreService from 'src/genre/genre.service';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { LyricsService } from 'src/lyrics/lyrics.service';

@Injectable()
export default class SongService extends RepositoryService<
	Song,
	SongQueryParameters.CreateInput,
	SongQueryParameters.WhereInput,
	SongQueryParameters.ManyWhereInput,
	SongQueryParameters.UpdateInput,
	SongQueryParameters.WhereInput,
	SongQueryParameters.RelationInclude,
	SongQueryParameters.SortingParameter,
	Song & { illustration: string }
> {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => LyricsService))
		private lyricsService: LyricsService,
	) {
		super();
	}

	/**
	 * Create a Song, and saves it in the database
	 * @param song the parameters to build the song
	 * @param include the relation fields to include in the returned object
	 * @returns the created song
	 */
	async create(song: SongQueryParameters.CreateInput, include?: SongQueryParameters.RelationInclude) {
		const genres = await Promise.all(
			song.genres.map(async (where) => await this.genreService.get(where))
		);
		try {
			return await this.prismaService.song.create({
				data: {
					genres: {
						connect: genres.map(
							(genre) => GenreQueryParameters.buildQueryParametersForOne({ id: genre.id })
						)
					},
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
			let artist = await this.artistService.get(song.artist);
			throw new SongAlreadyExistsException(new Slug(song.name), new Slug(artist.name));
		}
	}

	/**
	 * Finds a song in the database
	 * @param where the query parameters to find the song
	 * @param include the relations to include in the returned value
	 */
	async get(where: SongQueryParameters.WhereInput, include?: SongQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.song.findFirst({
				rejectOnNotFound: true,
				where: SongQueryParameters.buildQueryParametersForOne(where),
				include: SongQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw await this.onNotFound(where)
		}
	}

	/**
	 * Find song and only return specified fields
	 * @param where the parameters to find the song 
	 * @param select the fields to return
	 * @returns the select fields of an object
	 */
	 async select(
		where: SongQueryParameters.WhereInput,
		select: Partial<Record<keyof Song, boolean>>
	): Promise<Partial<Song>> {
		try {
			return await this.prismaService.song.findFirst({
				rejectOnNotFound: true,
				where: SongQueryParameters.buildQueryParametersForOne(where),
				select: select
			});
		} catch {
			throw await this.onNotFound(where);
		}
	}

	/**
	 * Find multiple songs
	 * @param where the parameters to find the songs
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include
	 */
	async getMany(
		where: SongQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: SongQueryParameters.RelationInclude,
		sort?: SongQueryParameters.SortingParameter,
	) {
		return this.prismaService.song.findMany({
			where: SongQueryParameters.buildQueryParametersForMany(where),
			include: SongQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination) 
		});
	}

	/**
	 * Count the songs that match the query parametets
	 * @param where the query parameters
	 * @returns the number of match
	 */
	async count(where: SongQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.song.count({
			where: SongQueryParameters.buildQueryParametersForMany(where)
		});
	}
	
	/**
	 * Updates a song in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the album to update
	 * @returns the updated song
	 */
	async update(
		what: SongQueryParameters.UpdateInput,
		where: SongQueryParameters.WhereInput
	): Promise<Song> {
		const genres = what.genres ? await Promise.all(
			what.genres.map(async (where) => await this.genreService.get(where))
		) : [];
		const artist = where.bySlug
			? await this.artistService.get(where.bySlug.artist)
			: undefined
		try {
			return await this.prismaService.song.update({
				data: {
					...what,
					genres: what.genres ? {
						connect: genres.map(
							(genre) => GenreQueryParameters.buildQueryParametersForOne({ id: genre.id })
						)
					} : undefined,
					artist: what.artist ? {
						connect: ArtistQueryParameters.buildQueryParametersForOne(what.artist),
					} : undefined,
				},
				where: {
					id: where.byId?.id,
					slug_artistId: where.bySlug ? {
						slug: where.bySlug.slug.toString(),
						artistId: artist!.id,
					} : undefined
				}
			});
		} catch {
			throw await this.onNotFound(where);
		}
	}

	/**
	 * Increment a song's play count
	 * @param where the query parameter to find the song to update
	 * @returns the updated song
	 */
	 async incrementPlayCount(
		where: SongQueryParameters.WhereInput
	): Promise<void> {
		const song = await this.get(where);
		await this.update(
			{ playCount: song.playCount + 1 },
			{ byId: { id: song.id } },
		);
	}
	
	/**
	 * Deletes a song
	 * @param where Query parameters to find the song to delete 
	 */
	async delete(where: SongQueryParameters.WhereInput): Promise<Song> {
		let song = await this.get(where, { tracks: true, genres: true });
		await Promise.allSettled(
			song.tracks.map((track) => this.trackService.delete({ id: track.id }))
		);
		try {
			await this.lyricsService.delete({ songId: song.id }).catch(() => {});
			await this.prismaService.song.delete({
				where: SongQueryParameters.buildQueryParametersForOne({ byId: { id: song.id } })
			});
		} catch {
			return song;
		}
		Logger.warn(`Song '${song.slug}' deleted`);
		await this.artistService.deleteArtistIfEmpty({ id: song.artistId });
		await Promise.all(
			song.genres.map((genre) => this.genreService.deleteIfEmpty({ id: genre.id }))
		);
		return song;
	}
	
	/**
	 * Deletes a song if it does not have related tracks
	 */
	async deleteIfEmpty(where: SongQueryParameters.WhereInput): Promise<void> {
		const trackCount = await this.trackService.count({ bySong: where });
		if (trackCount == 0)
			await this.delete(where);
	}
	/**
	 * Finds a song, or creates one if it does not exist already
	 * @param where where the query parameters to fond or create the release
	 * @returns the fetched or createdrelease
	 */
	async getOrCreate(where: SongQueryParameters.GetOrCreateInput, include?: SongQueryParameters.RelationInclude) {
		try {
			return await this.get(
				{ bySlug: { slug: new Slug(where.name), artist: where.artist}},
				include
			);
		} catch {
			return this.create(where, include);
		}
	}

	async buildResponse<T extends Song & { illustration: string }> (
		song: Song & Partial<{ tracks: Track[], artist: Artist }>
	): Promise<T> {
		let response: T = <T>{
			...song,
			illustration: `/illustrations/songs/${song.id}`
		};
		if (song.tracks !== undefined)
			response = {
				...response,
				tracks: await Promise.all(song.tracks.map(
					(track) => this.trackService.buildResponse(track)
				))
			}
		if (song.artist !== undefined)
			response = {
				...response,
				artist: await this.artistService.buildResponse(song.artist)
			}
		return response;
	}

	protected async onNotFound(where: SongQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.byId)
			throw new SongNotFoundByIdException(where.byId.id);
		const artist = await this.artistService.get(where.bySlug.artist)
		throw new SongNotFoundException(where.bySlug.slug, new Slug(artist.slug));
	}
}
