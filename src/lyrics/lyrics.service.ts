import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import type { Lyrics, Prisma, Song } from '@prisma/client';
const { getLyrics } = require('genius-lyrics-api');
import type { MeeloException } from 'src/exceptions/meelo-exception';
import PrismaService from 'src/prisma/prisma.service';
import RepositoryService from 'src/repository/repository.service';
import Slug from 'src/slug/slug';
import type SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import { LyricsAlreadyExistsExceptions, LyricsNotFoundByIDException, LyricsNotFoundBySongException, MissingGeniusAPIKeyException, NoLyricsFoundException } from './lyrics.exceptions';
import type LyricsQueryParameters from './models/lyrics.query-parameters';

@Injectable()
export class LyricsService extends RepositoryService<
	Lyrics,
	{ song: Song },
	LyricsQueryParameters.CreateInput,
	LyricsQueryParameters.WhereInput,
	LyricsQueryParameters.ManyWhereInput,
	LyricsQueryParameters.UpdateInput,
	LyricsQueryParameters.DeleteInput,
	Prisma.LyricsCreateInput,
	Prisma.LyricsWhereInput,
	Prisma.LyricsWhereInput,
	Prisma.LyricsUpdateInput,
	Prisma.LyricsWhereUniqueInput
> {
	private readonly geniusApiKey: string | null;
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {
		super(prismaService.lyrics);
		this.geniusApiKey = process.env.GENIUS_ACCESS_TOKEN ?? null
	}

	/**
	 * Create
	 */
	formatCreateInput(input: LyricsQueryParameters.CreateInput) {
		return {
			content: input.content,
			song: { connect: { id: input.songId } }
		};
	}
	protected formatCreateInputToWhereInput(input: LyricsQueryParameters.CreateInput) {
		return { song: { byId: { id: input.songId } } };
	}
	protected async onCreationFailure(input: LyricsQueryParameters.CreateInput) {
		const parentSong = await this.songService.get({ byId: { id: input.songId }});
		return new LyricsAlreadyExistsExceptions(new Slug(parentSong.slug));
	}

	/**
	 * Get
	 */
	static formatWhereInput(input: LyricsQueryParameters.WhereInput) {
		return {
			id: input.id,
			song: input.song ?
				SongService.formatWhereInput(input.song)
			: undefined,
		}
	}
	formatWhereInput = LyricsService.formatWhereInput;

	static formatManyWhereInput(input: LyricsQueryParameters.ManyWhereInput) {
		return {
			song: input.bySongs ? SongService.formatManyWhereInput(input.bySongs) : undefined
		}
	}
	formatManyWhereInput = LyricsService.formatManyWhereInput;

	/**
	 * Update
	 */
	async update(what: LyricsQueryParameters.UpdateInput, where: LyricsQueryParameters.WhereInput) {
		if (where.id)
			return super.update(what, { id: where.id });
		let songId: number | undefined = where.song?.byId?.id;
		if (where.song?.bySlug)
			songId = (await this.songService.select(where.song, { id: true })).id
		try {
			return await this.prismaService.lyrics.update({
				data: this.formatUpdateInput(what),
				where: this.formatDeleteInput({ songId: songId! })
			});
		} catch {
			throw await this.onUpdateFailure(what, where);
		}
		
	}
	formatUpdateInput(what: LyricsQueryParameters.UpdateInput) {
		return  {
			content: what.content
		}
	}
	
	/**
	 * Delete
	 */
	async onDeletionFailure(where: LyricsQueryParameters.DeleteInput) {
		return await this.onNotFound(this.formatDeleteInputToWhereInput(where));
	}

	async buildResponse(input: Lyrics & { song?: Song }): Promise<{ lyrics: string, song?: Song }> {
		let response: any = { lyrics: input.content };
		if (input.song)
			response.song = await this.songService.buildResponse(input.song)
		return response;
	}
	formatDeleteInput(where: LyricsQueryParameters.DeleteInput) {
		return {
			id: where.id,
			songId: where.songId,
		};
	}
	protected formatDeleteInputToWhereInput(input: LyricsQueryParameters.DeleteInput): LyricsQueryParameters.WhereInput {
		if (input.id)
			return { id: input.id }
		return { song: { byId: { id: input.songId! }} }
	}

	/**
	 * Returns an exception for when a lyric is not found in the database
	 * @param where the queryparameters used to find the lyrics
	 */
	async onNotFound(
		where: LyricsQueryParameters.WhereInput
	): Promise<MeeloException> {
		if (where.song) {
			await this.songService.throwIfNotFound(where.song);
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

		if (options.force == false && song.lyrics !== null) {
			return;
		}
		try {
			const lyrics = await this.downloadLyrics(song.artist.name, song.name);
			Logger.log(`Lyrics found for song '${song.name}' by '${song.artist.name}'`);
			if (song.lyrics)
				await this.update({ content: lyrics }, { song: songWhere });
			else
				await this.create({ content: lyrics, songId: song.id });
		} catch {
			Logger.warn(`No lyrics found for song '${song.name}' by '${song.artist.name}'`)
			throw new NoLyricsFoundException(song.artist.name, song.name);
		}
	}
}
