import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import type { LyricsWithRelations } from 'src/prisma/models';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import PrismaService from 'src/prisma/prisma.service';
import RepositoryService from 'src/repository/repository.service';
import Slug from 'src/slug/slug';
import type SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import {
	LyricsAlreadyExistsExceptions,
	LyricsNotFoundByIDException,
	LyricsNotFoundBySongException,
	MissingGeniusAPIKeyException,
	NoLyricsFoundException
} from './lyrics.exceptions';
import type LyricsQueryParameters from './models/lyrics.query-parameters';
import { Prisma } from '@prisma/client';
import { LyricsResponse } from './models/lyrics.response';
import SortingParameter from 'src/sort/models/sorting-parameter';
import Identifier from 'src/identifier/models/identifier';
import Logger from 'src/logger/logger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getLyrics } = require('genius-lyrics-api');

@Injectable()
export class LyricsService extends RepositoryService<
	LyricsWithRelations,
	LyricsQueryParameters.CreateInput,
	LyricsQueryParameters.WhereInput,
	LyricsQueryParameters.ManyWhereInput,
	LyricsQueryParameters.UpdateInput,
	LyricsQueryParameters.DeleteInput,
	[],
	Prisma.LyricsCreateInput,
	Prisma.LyricsWhereInput,
	Prisma.LyricsWhereInput,
	Prisma.LyricsUpdateInput,
	Prisma.LyricsWhereUniqueInput,
	Prisma.LyricsOrderByWithRelationInput
> {
	private readonly logger = new Logger(LyricsService.name);
	private readonly geniusApiKey: string | null;
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {
		super(prismaService.lyrics);
		this.geniusApiKey = process.env.GENIUS_ACCESS_TOKEN ?? null;
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
		return { song: { id: input.songId } };
	}

	protected async onCreationFailure(input: LyricsQueryParameters.CreateInput) {
		const parentSong = await this.songService.get({ id: input.songId });

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
		};
	}

	formatWhereInput = LyricsService.formatWhereInput;

	static formatManyWhereInput(input: LyricsQueryParameters.ManyWhereInput) {
		return {
			song: input.songs ? SongService.formatManyWhereInput(input.songs) : undefined
		};
	}

	formatManyWhereInput = LyricsService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): LyricsQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			RepositoryService.UnexpectedStringIdentifier
		);
	}

	formatSortingInput<S extends SortingParameter<[]>>(sortingParameter: S) {
		return { id: sortingParameter.order };
	}

	/**
	 * Update
	 */
	async update(what: LyricsQueryParameters.UpdateInput, where: LyricsQueryParameters.WhereInput) {
		if (where.id != undefined) {
			return super.update(what, { id: where.id });
		}
		let songId: number | undefined = where.song?.id;

		if (where.song?.bySlug) {
			songId = (await this.songService.select(where.song, { id: true })).id;
		}
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
		return {
			content: what.content
		};
	}

	/**
	 * Delete
	 */
	async onDeletionFailure(where: LyricsQueryParameters.DeleteInput) {
		return this.onNotFound(this.formatDeleteInputToWhereInput(where));
	}

	async buildResponse(input: LyricsWithRelations): Promise<LyricsResponse> {
		const response: LyricsResponse = { lyrics: input.content };

		if (input.song) {
			response.song = await this.songService.buildResponse(input.song);
		}
		return response;
	}

	formatDeleteInput(where: LyricsQueryParameters.DeleteInput) {
		return {
			id: where.id,
			songId: where.songId,
		};
	}

	protected formatDeleteInputToWhereInput(
		input: LyricsQueryParameters.DeleteInput
	): LyricsQueryParameters.WhereInput {
		if (input.id) {
			return { id: input.id };
		}
		return { song: { id: input.songId! } };
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
			throw new LyricsNotFoundBySongException(where.song.id ?? where.song.bySlug!.slug);
		}
		throw new LyricsNotFoundByIDException(where.id);
	}

	/**
	 * Fetch a song's lyrics from Genius
	 * @param artistName the name of the artist of the song
	 * @param songName the name of the song to fetch the lyrics of
	 */
	async downloadLyrics(artistName: string, songName: string): Promise<string> {
		if (!this.geniusApiKey) {
			throw new MissingGeniusAPIKeyException();
		}
		try {
			const query = {
				apiKey: this.geniusApiKey,
				title: songName,
				artist: artistName,
				optimizeQuery: true
			};
			const lyrics = await getLyrics(query);

			if (lyrics === null) {
				throw new NoLyricsFoundException(artistName, songName);
			}
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
	async registerLyrics(
		songWhere: SongQueryParameters.WhereInput, options: { force: boolean }
	): Promise<void> {
		const song = await this.songService.get(songWhere, { artist: true, lyrics: true });

		if (options.force == false && song.lyrics !== null) {
			return;
		}
		try {
			const lyrics = await this.downloadLyrics(song.artist.name, song.name);

			this.logger.log(`Lyrics found for song '${song.name}' by '${song.artist.name}'`);
			if (song.lyrics) {
				await this.update({ content: lyrics }, { song: songWhere });
			} else {
				await this.create({ content: lyrics, songId: song.id });
			}
		} catch {
			this.logger.warn(`No lyrics found for song '${song.name}' by '${song.artist.name}'`);
			throw new NoLyricsFoundException(song.artist.name, song.name);
		}
	}
}
