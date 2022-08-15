import { Injectable, Logger } from '@nestjs/common';
import type { Lyrics, Song } from '@prisma/client';
const { getLyrics } = require('genius-lyrics-api');
import { InvalidRequestException, MeeloException } from 'src/exceptions/meelo-exception';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import PrismaService from 'src/prisma/prisma.service';
import RepositoryService from 'src/repository/repository.service';
import Slug from 'src/slug/slug';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import { LyricsAlreadyExistsExceptions, LyricsNotFoundByIDException, LyricsNotFoundBySongException, MissingGeniusAPIKeyException, NoLyricsFoundException } from './lyrics.exceptions';
import LyricsQueryParameters from './models/lyrics.query-parameters';

@Injectable()
export class LyricsService extends RepositoryService<
	Lyrics,
	LyricsQueryParameters.CreateInput,
	LyricsQueryParameters.WhereInput,
	{},
	LyricsQueryParameters.UpdateInput,
	LyricsQueryParameters.DeleteInput,
	LyricsQueryParameters.RelationInclude,
	{},
	Lyrics & { song?: Song}
> {
	private readonly geniusApiKey: string | null;
	constructor(
		private prismaService: PrismaService,
		private songService: SongService,
	) {
		super();
		this.geniusApiKey = process.env.GENIUS_ACCESS_TOKEN ?? null
	}

	/**
	 * Add new lyrics for a song
	 * @param lyrics the query parameters to create the lyrics
	 * @param include the relation to include in the returned lyrics
	 * @returns the newly created lyrics 
	 */
	async create(
		lyrics: LyricsQueryParameters.CreateInput,
		include?: Partial<Record<'song', boolean>>
	): Promise<Lyrics> {
		try {
			return await this.prismaService.lyrics.create({
				data: {
					...lyrics,
					song: {
						connect: SongQueryParameters.buildQueryParametersForOne(lyrics.song)
					}
				},
				include: LyricsQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			const parentSong = await this.songService.get(lyrics.song);
			throw new LyricsAlreadyExistsExceptions(new Slug(parentSong.slug));
		}
	}
	async get(
		where: LyricsQueryParameters.WhereInput,
		include?: LyricsQueryParameters.RelationInclude
	): Promise<Lyrics> {
		try {
			return await this.prismaService.lyrics.findFirst({
				rejectOnNotFound: true,
				where: LyricsQueryParameters.buildQueryParametersForOne(where),
				include: LyricsQueryParameters.buildIncludeParameters(include)
			})
		} catch {
			throw await this.onNotFound(where);
		}
	}
	async getMany(
		_where: {},
		_pagination?: PaginationParameters,
		_include?: Partial<Record<'song', boolean>>,
		_sort?: {}
	): Promise<Lyrics[]> {
		throw new InvalidRequestException('Method not implemented.');
	}
	async count(_where: {}): Promise<number> {
		throw new InvalidRequestException('Method not implemented.');
	}
	async update(
		what: LyricsQueryParameters.UpdateInput,
		where: LyricsQueryParameters.WhereInput
	): Promise<Lyrics> {
		const lyrics = await this.get(where);
		try {
			return await this.prismaService.lyrics.update({
				where: {
					id: lyrics.id
				},
				data: {
					content: what.content
				}
			});
		} catch {
			throw this.onNotFound(where);
		}
	}
	/**
	 * Delete a lyric to a song in the database
	 */
	async delete(where: LyricsQueryParameters.DeleteInput): Promise<Lyrics> {
		try {
			return await this.prismaService.lyrics.delete({
				where: where
			});
		} catch {
			if (where.id !== undefined)
				throw await this.onNotFound({ id: where.id })
			else {
				throw await this.onNotFound({
					song: { byId: { id: where.songId }},
				});
			}
		}
	}
	/**
	 * Get a lyric entry, or create one if it does not exists
	 */
	async getOrCreate(
		input: LyricsQueryParameters.GetOrCreateInput,
		include?: LyricsQueryParameters.RelationInclude
	): Promise<Lyrics> {
		try {
			return await this.get(input, include);
		} catch {
			return this.create(input, include);
		}
	}

	buildResponse(input: Lyrics & { song?: Song }): Lyrics & { song?: Song } {
		let response = input;
		if (input.song)
			response = {
				...response,
				song: this.songService.buildResponse(input.song)
			}
		return response;
	}

	/**
	 * Returns an exception for when a lyric is not found in the database
	 * @param where the queryparameters used to find the lyrics
	 */
	protected async onNotFound(
		where: LyricsQueryParameters.WhereInput
	): Promise<MeeloException> {
		if (where.song) {
			await this.songService.get(where.song);
			throw new LyricsNotFoundBySongException(where.song.byId?.id ?? where.song.bySlug!.slug);
		}
		throw new LyricsNotFoundByIDException(where.id);
	}

	/**
	 * Fetch a song's lyrics from Genius
	 * @param artistName the name of the artist of the song
	 * @param songName the name of the song to fetch the lyrics of
	 */
	async downloadLyrics(artistName: string, songName: string): Promise<string> {
		if (!this.geniusApiKey)
			throw new MissingGeniusAPIKeyException();
		try {
			const query = {
				apiKey: this.geniusApiKey,
				title: songName,
				artist: artistName,
				optimizeQuery: true
			};
			const lyrics = await getLyrics(query);
			if (lyrics === null)
				throw new NoLyricsFoundException(artistName, songName);
			return lyrics;
		} catch {
			throw new NoLyricsFoundException(artistName, songName);
		}
	}

	/**
	 * Fetch  and save lyrics of a song in the database
	 * @param songWhere 
	 * @param options if 'force' is true, will refetch the lyrics even if they already exists
	 * @returns an empty promise
	 */
	async registerLyrics(songWhere: SongQueryParameters.WhereInput, options: { force: boolean }): Promise<void> {
		const song = await this.songService.get(songWhere, { artist: true, lyrics: true });

		if (options.force == false && song.lyrics == null) {
			return;
		}
		try {
			const lyrics = await this.downloadLyrics(song.artist.name, song.name);
			Logger.log(`Lyrics found for song '${song.name}' by '${song.artist.name}'`);
			if (song.lyrics)
				await this.update({ content: lyrics }, { song: songWhere });
			else
				await this.create({ content: lyrics, song: songWhere });
		} catch {
			Logger.warn(`No lyrics found for song '${song.name}' by '${song.artist.name}'`)
			throw new NoLyricsFoundException(song.artist.name, song.name);
		}
	}
}
