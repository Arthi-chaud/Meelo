import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import Slug from 'src/slug/slug';
import type GenreQueryParameters from './models/genre.query-parameters';
import { Genre, GenreWithRelations } from 'src/prisma/models';
import SongService from 'src/song/song.service';
import RepositoryService from 'src/repository/repository.service';
import type SongQueryParameters from "../song/models/song.query-params";
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import ArtistService from 'src/artist/artist.service';
import { Prisma } from '@prisma/client';
import { parseIdentifierSlugs } from 'src/identifier/identifier.parse-slugs';
import Identifier from 'src/identifier/models/identifier';
import Logger from 'src/logger/logger';
import { PrismaError } from 'prisma-error-enum';
import {
	GenreAlreadyExistsException,
	GenreNotEmptyException,
	GenreNotFoundByIdException,
	GenreNotFoundException
} from './genre.exceptions';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import AlbumService from 'src/album/album.service';
import { PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';

@Injectable()
export default class GenreService extends RepositoryService<
	GenreWithRelations,
	GenreQueryParameters.CreateInput,
	GenreQueryParameters.WhereInput,
	GenreQueryParameters.ManyWhereInput,
	GenreQueryParameters.UpdateInput,
	GenreQueryParameters.DeleteInput,
	GenreQueryParameters.SortingKeys,
	Prisma.GenreCreateInput,
	Prisma.GenreWhereInput,
	Prisma.GenreWhereInput,
	Prisma.GenreUpdateInput,
	Prisma.GenreWhereUniqueInput,
	Prisma.GenreOrderByWithRelationInput
> {
	private readonly logger = new Logger(GenreService.name);
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
	) {
		super(prismaService.genre);
	}

	/**
	 * Create
	 */
	formatCreateInput(input: GenreQueryParameters.CreateInput): Prisma.GenreCreateInput {
		return {
			...input,
			slug: new Slug(input.name).toString()
		};
	}

	protected formatCreateInputToWhereInput(
		input: GenreQueryParameters.CreateInput
	): GenreQueryParameters.WhereInput {
		return { slug: new Slug(input.name) };
	}

	protected onCreationFailure(error: Error, input: GenreQueryParameters.CreateInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.UniqueConstraintViolation) {
			return new GenreAlreadyExistsException(new Slug(input.name));
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * Find a genre
	 */
	static formatWhereInput(input: GenreQueryParameters.WhereInput) {
		return {
			...input,
			slug: input?.slug?.toString()
		};
	}

	formatWhereInput = GenreService.formatWhereInput;

	static formatManyWhereInput(where: GenreQueryParameters.ManyWhereInput) {
		return {
			name: where.name
				? buildStringSearchParameters(where.name)
				: undefined,
			songs: where.song || where.artist ? {
				some: where.song
					? SongService.formatWhereInput(where.song)
					: where.artist
						? { artist: ArtistService.formatWhereInput(where.artist) }
						: undefined
			} : undefined,

		};
	}

	formatManyWhereInput = GenreService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): GenreQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(identifier, (stringIdentifier) => {
			const [slug] = parseIdentifierSlugs(stringIdentifier, 1);

			return { slug };
		});
	}

	formatSortingInput(
		sortingParameter: GenreQueryParameters.SortingParameter
	) {
		switch (sortingParameter.sortBy) {
		case 'name':
			return { slug: sortingParameter.order };
		case 'songCount':
			return { songs: { _count: sortingParameter.order } };
		case undefined:
			return { id: sortingParameter.order };
		default:
			return { [sortingParameter.sortBy]: sortingParameter.order };
		}
	}

	/**
	 * Update a genre
	 */
	formatUpdateInput(what: GenreQueryParameters.CreateInput) {
		return {
			...what,
			slug: new Slug(what.name).toString(),
		};
	}

	/**
	 * Delete a genre
	 */
	formatDeleteInput(where: GenreQueryParameters.WhereInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(input: GenreQueryParameters.WhereInput) {
		return input;
	}

	/**
	 * Deletes a genre
	 * @param where the query parameter to find the genre to delete
	 */
	async delete(where: GenreQueryParameters.DeleteInput): Promise<Genre> {
		const genre = await this.get(where, { songs: true });

		if (genre.songs.length == 0) {
			return super.delete(where).then((deleted) => {
				this.logger.warn(`Genre '${deleted.slug}' deleted`);
				return deleted;
			});
		}
		throw new GenreNotEmptyException(genre.id);
	}

	/**
	 * Delete all genres that do not have related songs
	 */
	async housekeeping(): Promise<void> {
		const emptyGenres = await this.prismaService.genre.findMany({
			select: {
				id: true,
				_count: {
					select: { songs: true }
				}
			}
		}).then((genres) => genres.filter(
			(genre) => !genre._count.songs
		));

		await Promise.all(
			emptyGenres.map(({ id }) => this.delete({ id }))
		);
	}

	/**
	 * Find the song's genres
	 * @param where the query parameters to find the song
	 */
	async getSongGenres(
		where: SongQueryParameters.WhereInput,
		include?: GenreQueryParameters.RelationInclude,
		sort?: GenreQueryParameters.SortingParameter,
		pagination?: PaginationParameters
	) {
		const genres = await this.getMany(
			{ song: where },
			pagination,
			include,
			sort
		);

		if (genres.length == 0) {
			await this.songService.throwIfNotFound(where);
		}
		return genres;
	}

	/**
	 * Find the album's genres
	 * @param where the query parameters to find the song
	 */
	async getAlbumGenres(
		where: AlbumQueryParameters.WhereInput,
		include?: GenreQueryParameters.RelationInclude,
		sort?: GenreQueryParameters.SortingParameter,
		pagination?: PaginationParameters
	) {
		const genres = await this.prismaService.genre.findMany({
			where: {
				songs: {
					some: {
						tracks: {
							some: {
								release: {
									album: AlbumService.formatWhereInput(where)
								}
							}
						}
					}
				}
			},
			include: RepositoryService.formatInclude(include),
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			...buildPaginationParameters(pagination),
		});

		if (genres.length == 0) {
			await this.albumService.throwIfNotFound(where);
		}
		return genres;
	}

	onNotFound(error: Error, where: GenreQueryParameters.WhereInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound) {
			if (where.id !== undefined) {
				return new GenreNotFoundByIdException(where.id);
			}
			return new GenreNotFoundException(where.slug);
		}
		return this.onUnknownError(error, where);
	}
}
