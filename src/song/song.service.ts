import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import type { Prisma } from '@prisma/client';
import { SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException } from './song.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type SongQueryParameters from './models/song.query-params';
import TrackService from 'src/track/track.service';
import GenreService from 'src/genre/genre.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { LyricsService } from 'src/lyrics/lyrics.service';
import { CompilationArtistException } from 'src/artist/artist.exceptions';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import IllustrationService from 'src/illustration/illustration.service';
import { buildPaginationParameters, PaginationParameters } from 'src/pagination/models/pagination-parameters';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';
import { Artist, Song, Track } from 'src/prisma/models';

@Injectable()
export default class SongService extends RepositoryService<
	Song,
	SongQueryParameters.CreateInput,
	SongQueryParameters.WhereInput,
	SongQueryParameters.ManyWhereInput,
	SongQueryParameters.UpdateInput,
	SongQueryParameters.DeleteInput,
	Prisma.SongCreateInput,
	Prisma.SongWhereInput,
	Prisma.SongWhereInput,
	Prisma.SongUpdateInput,
	Prisma.SongWhereUniqueInput
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
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
	) {
		super(prismaService.song);
	}

	/**
	 * Create
	 */
	async create<I extends SongQueryParameters.RelationInclude>(input: SongQueryParameters.CreateInput, include?: I) {
		await Promise.all(input.genres.map(
			(genre) => this.genreService.throwIfNotFound(genre)
		));
		return await super.create(input, include);
	}
	formatCreateInput(song: SongQueryParameters.CreateInput) {
		return {
			genres: {
				connect: song.genres.map((genre) => GenreService.formatWhereInput(genre))
			},
			artist: {
				connect: ArtistService.formatWhereInput(song.artist)
			},
			playCount: 0,
			name: song.name,
			slug: new Slug(song.name).toString()
		};
	}
	protected formatCreateInputToWhereInput(input: SongQueryParameters.CreateInput): SongQueryParameters.WhereInput {
		return {
			bySlug: { slug: new Slug(input.name), artist: input.artist},
		}
	}
	protected async onCreationFailure(song: SongQueryParameters.CreateInput) {
		let artist = await this.artistService.get(song.artist);
		return new SongAlreadyExistsException(new Slug(song.name), new Slug(artist.name));
	}

	/**
	 * Get
	 */

	static formatWhereInput(where: SongQueryParameters.WhereInput) {
		return {
			id: where.byId?.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug
				? ArtistService.formatWhereInput(where.bySlug.artist)
				: undefined
		};
	}
	formatWhereInput = SongService.formatWhereInput;
	static formatManyWhereInput(where: SongQueryParameters.ManyWhereInput) {
		if (where.artist?.compilationArtist)
			throw new CompilationArtistException('Song');
		return {
			genres: where.genre ? {
				some: GenreService.formatWhereInput(where.genre)
			} : undefined,
			artistId: where.artist?.id,
			artist: where.artist?.slug ? {
				slug: where.artist.slug.toString()
			} : undefined,
			name: buildStringSearchParameters(where.name),
			playCount: {
				equals: where.playCount?.exact,
				gt: where.playCount?.moreThan,
				lt: where.playCount?.below
			},
			tracks: where.library ? {
				some: TrackService.formatManyWhereInput({ byLibrarySource: where.library })
			} : undefined
		};
	}
	formatManyWhereInput = SongService.formatManyWhereInput;

	async onNotFound(where: SongQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.byId)
			throw new SongNotFoundByIdException(where.byId.id);
		const artist = await this.artistService.get(where.bySlug.artist)
		throw new SongNotFoundException(where.bySlug.slug, new Slug(artist.slug));
	}

	/**
	 * Update
	 */
	formatUpdateInput(what: SongQueryParameters.UpdateInput): Prisma.SongUpdateInput {
		return {
			...what,
			genres: what.genres ? {
				connect: what.genres.map(
					(genre) => GenreService.formatWhereInput(genre)
				)
			} : undefined,
			artist: what.artist ? {
				connect: ArtistService.formatWhereInput(what.artist),
			} : undefined,
		};
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
	) {
		if (what.genres)
			await Promise.all(
				what.genres.map(async (where) => await this.genreService.get(where))
			);
		if (where.bySlug) {
			const artistId = (await this.artistService.select(where.bySlug.artist, { id: true })).id
			try {
				return await this.prismaService.song.update({
					data: this.formatUpdateInput(what),
					where: { slug_artistId: {
						slug: where.bySlug!.slug.toString(),
						artistId: artistId
					} }
				})
			} catch {
				throw await this.onUpdateFailure(what, where);
			}
		} else
			return await super.update(what, where);
	}

	/**
	 * Use the earliest track as master
	 * @param where The query params to find the song to update
	 * @return the new master, if there is one
	 */
	async updateSongMaster(where: SongQueryParameters.WhereInput): Promise<Track | null> {
		let tracks = await this.trackService.getSongTracks(where, {}, { release: true });
		const currentMaster = tracks.find((track) => track.master);
		const sortedTracks = tracks
			.filter((track) => track.release.releaseDate !== null)
			.sort((trackA, trackB) => trackA.release.releaseDate!.getTime() - trackB.release.releaseDate!.getTime());
		const sortedAudioTracks = sortedTracks.filter((track) => track.type == 'Audio');
		const newMaster = sortedAudioTracks.at(0) ?? sortedTracks.at(0) ?? tracks.at(0);
		if (newMaster == null)
			return null;
		if (newMaster.id === currentMaster?.id)
			return newMaster;
		await this.trackService.setTrackAsMaster({ trackId: newMaster.id, song: where });
		return { ...newMaster, master: true };
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
	 * Delete
	 */
	formatDeleteInput(where: SongQueryParameters.DeleteInput) {
		return where;
	}
	protected formatDeleteInputToWhereInput(input: SongQueryParameters.DeleteInput): SongQueryParameters.WhereInput {
		return { byId: { id: input.id } };
	}

	/**
	 * Deletes a song
	 * @param where Query parameters to find the song to delete 
	 */
	async delete(where: SongQueryParameters.DeleteInput): Promise<Song> {
		let song = await this.get(
			this.formatDeleteInputToWhereInput(where),
			{ tracks: true, genres: true }
		);
		await Promise.allSettled(
			song.tracks.map((track) => this.trackService.delete({ id: track.id }))
		);
		try {
			await this.lyricsService.delete({ songId: song.id }).catch(() => {});
			await super.delete(where);
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
	async deleteIfEmpty(where: SongQueryParameters.DeleteInput): Promise<void> {
		const trackCount = await this.trackService.count({ bySong: this.formatDeleteInputToWhereInput(where) });
		if (trackCount == 0)
			await this.delete(where);
	}

	async buildResponse<T extends Song & { illustration: string }> (
		song: Song & Partial<{ tracks: Track[], artist: Artist }>
	): Promise<T> {
		let response: T = <T>{
			...song,
			illustration: await this.illustrationService.getSongIllustrationLink(song.id)
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

	/**
	 * Get songs from the sma eartist that have the same base name
	 * @param where thr query parameters to find the song
	 * @param pagination the pagination parameters
	 * @param include the relations to include with the returned songs
	 * @returns the matching songs
	 */
	async getSongVersions<I extends SongQueryParameters.RelationInclude>(
		where: SongQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter
	) {
		const { name, artistId } = await this.select(where, { name: true, artistId: true });
		const baseSongName = this.getBaseSongName(name);
		return await this.prismaService.song.findMany({
			where: {
				artistId: artistId,
				name: { contains: baseSongName }
			},
			orderBy: buildSortingParameter(sort),
			include: RepositoryService.formatInclude(include),
			...buildPaginationParameters(pagination)
		})
	}

	/**
	 * Removes all extensions for a song name
	 * An extension is a group of characters in brackets, parenthesis or curly brackets
	 * @param songName the name of the song to strip
	 */
	private getBaseSongName(songName: string): string {
		const extensionDelimiters = [
			['(', ')'],
			['{', '}'],
			['[', ']']
		];
		let strippedSongName = songName
		for (const delimiter of extensionDelimiters) {
			strippedSongName.match(`\\s*\\${delimiter[0]}.+\\${delimiter[1]}\\s*`)?.forEach((matched) => {
				strippedSongName = strippedSongName.replace(matched, '')
			})
		}
		return strippedSongName;
	}
}
