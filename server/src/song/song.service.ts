import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import type { Prisma } from '@prisma/client';
import {
	SongAlreadyExistsException, SongNotFoundByIdException, SongNotFoundException
} from './song.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type SongQueryParameters from './models/song.query-params';
import TrackService from 'src/track/track.service';
import GenreService from 'src/genre/genre.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { LyricsService } from 'src/lyrics/lyrics.service';
import { CompilationArtistException } from 'src/artist/artist.exceptions';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import { PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import SortingParameter from 'src/sort/models/sorting-parameter';
import {
	Song, SongWithRelations, Track
} from 'src/prisma/models';
import { parseIdentifierSlugs } from 'src/identifier/identifier.parse-slugs';
import Identifier from 'src/identifier/models/identifier';
import Logger from 'src/logger/logger';

@Injectable()
export default class SongService extends RepositoryService<
	SongWithRelations,
	SongQueryParameters.CreateInput,
	SongQueryParameters.WhereInput,
	SongQueryParameters.ManyWhereInput,
	SongQueryParameters.UpdateInput,
	SongQueryParameters.DeleteInput,
	SongQueryParameters.SortingKeys,
	Prisma.SongCreateInput,
	Prisma.SongWhereInput,
	Prisma.SongWhereInput,
	Prisma.SongUpdateInput,
	Prisma.SongWhereUniqueInput,
	Prisma.SongOrderByWithRelationInput
> {
	private readonly logger = new Logger(SongService.name);
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => LyricsService))
		private lyricsService: LyricsService
	) {
		super(prismaService.song);
	}

	/**
	 * Create
	 */
	async create<I extends SongQueryParameters.RelationInclude>(
		input: SongQueryParameters.CreateInput, include?: I
	) {
		await Promise.all(input.genres.map(
			(genre) => this.genreService.throwIfNotFound(genre)
		));
		return super.create(input, include);
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

	protected formatCreateInputToWhereInput(
		input: SongQueryParameters.CreateInput
	): SongQueryParameters.WhereInput {
		return {
			bySlug: { slug: new Slug(input.name), artist: input.artist },
		};
	}

	protected async onCreationFailure(song: SongQueryParameters.CreateInput) {
		const artist = await this.artistService.get(song.artist);

		return new SongAlreadyExistsException(new Slug(song.name), new Slug(artist.name));
	}

	/**
	 * Get
	 */

	static formatWhereInput(where: SongQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug
				? ArtistService.formatWhereInput(where.bySlug.artist)
				: undefined
		};
	}

	formatWhereInput = SongService.formatWhereInput;
	static formatManyWhereInput(where: SongQueryParameters.ManyWhereInput) {
		if (where.artist?.compilationArtist) {
			throw new CompilationArtistException('Song');
		}
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
				some: TrackService.formatManyWhereInput({ library: where.library })
			} : undefined
		};
	}

	formatManyWhereInput = SongService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): SongQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(identifier, (stringIdentifier) => {
			const slugs = parseIdentifierSlugs(stringIdentifier, 2);

			return {
				bySlug: {
					slug: slugs[1],
					artist: { slug: slugs[0] }
				}
			};
		});
	}

	formatSortingInput(
		sortingParameter: SortingParameter<SongQueryParameters.SortingKeys>
	): Prisma.SongOrderByWithRelationInput {
		switch (sortingParameter.sortBy) {
		case 'name':
			return { slug: sortingParameter.order };
		case 'addDate':
			return { id: sortingParameter.order };
		case 'artistName':
			return { artist: this.artistService.formatSortingInput(
				{ sortBy: 'name', order: sortingParameter.order }
			) };
		default:
			return { [sortingParameter.sortBy ?? 'id']: sortingParameter.order };
		}
	}

	async onNotFound(where: SongQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.id != undefined) {
			throw new SongNotFoundByIdException(where.id);
		}
		const artist = await this.artistService.get(where.bySlug.artist);

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
		if (what.genres) {
			await Promise.all(
				what.genres.map((genreWhere) => this.genreService.get(genreWhere))
			);
		}
		if (where.bySlug) {
			const artistId = (await this.artistService.select(
				where.bySlug.artist, { id: true }
			)).id;

			try {
				return await this.prismaService.song.update({
					data: this.formatUpdateInput(what),
					where: { slug_artistId: {
						slug: where.bySlug!.slug.toString(),
						artistId: artistId
					} }
				});
			} catch {
				throw await this.onUpdateFailure(what, where);
			}
		} else {
			return super.update(what, where);
		}
	}

	/**
	 * Use the earliest track as master
	 * @param where The query params to find the song to update
	 * @return the new master, if there is one
	 */
	async updateSongMaster(where: SongQueryParameters.WhereInput): Promise<Track | null> {
		const tracks = await this.trackService.getSongTracks(where, {}, { release: true });
		const currentMaster = tracks.find((track) => track.master);
		const sortedTracks = tracks
			.filter((track) => track.release.releaseDate !== null)
			.sort((trackA, trackB) => {
				const releaseA = trackA.release;
				const releaseB = trackB.release;

				return releaseA.releaseDate!.getTime() - releaseB.releaseDate!.getTime();
			});
		const sortedAudioTracks = sortedTracks.filter((track) => track.type == 'Audio');
		const newMaster = sortedAudioTracks.at(0) ?? sortedTracks.at(0) ?? tracks.at(0);

		if (newMaster == null) {
			return null;
		}
		if (newMaster.id === currentMaster?.id) {
			return newMaster;
		}
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
			{ id: song.id },
		);
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: SongQueryParameters.DeleteInput) {
		return where;
	}

	protected formatDeleteInputToWhereInput(
		input: SongQueryParameters.DeleteInput
	): SongQueryParameters.WhereInput {
		return { id: input.id };
	}

	/**
	 * Deletes a song
	 * @param where Query parameters to find the song to delete
	 */
	async delete(where: SongQueryParameters.DeleteInput): Promise<Song> {
		const song = await this.get(
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
		this.logger.warn(`Song '${song.slug}' deleted`);
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
		const trackCount = await this.trackService.count(
			{ song: this.formatDeleteInputToWhereInput(where) }
		);

		if (trackCount == 0) {
			await this.delete(where);
		}
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

		return this.prismaService.song.findMany({
			where: {
				artistId: artistId,
				name: { contains: baseSongName }
			},
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			include: RepositoryService.formatInclude(include),
			...buildPaginationParameters(pagination)
		});
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
		let strippedSongName = songName;

		for (const delimiter of extensionDelimiters) {
			strippedSongName.match(`\\s*\\${delimiter[0]}.+\\${delimiter[1]}\\s*`)?.forEach((matched) => {
				strippedSongName = strippedSongName.replace(matched, '');
			});
		}
		return strippedSongName.split(' - ')[0];
	}
}
