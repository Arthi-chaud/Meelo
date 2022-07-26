import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import Slug from 'src/slug/slug';
import { GenreAlreadyExistsException, GenreNotFoundByIdException, GenreNotFoundException } from './genre.exceptions';
import GenreQueryParameters from './models/genre.query-parameters';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import type { Genre, Song } from '@prisma/client';
import SongService from 'src/song/song.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
@Injectable()
export default class GenreService extends RepositoryService<
	Genre,
	GenreQueryParameters.CreateInput,
	GenreQueryParameters.WhereInput,
	GenreQueryParameters.ManyWhereInput,
	GenreQueryParameters.UpdateInput,
	GenreQueryParameters.DeleteInput,
	GenreQueryParameters.RelationInclude,
	GenreQueryParameters.SortingParameter,
	Genre
> {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {
		super ();
	}

	/**
	 * Create a genre, and saves it in th"e database
	 * @param genre the album object to save
	 * @param include the relation to include in the returned value
	 * @returns the saved genre
	 */
	async create(
		genre: GenreQueryParameters.CreateInput,
		include?: GenreQueryParameters.RelationInclude
	) {
		const genreSlug = new Slug(genre.name);
		try {
			return await this.prismaService.genre.create({
				data: {
					...genre,
					slug: genreSlug.toString()
				},
				include: GenreQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw new GenreAlreadyExistsException(genreSlug);
		}
	}

	/**
	 * Find a genre
	 * @param where the parameters to find the genre
	 * @param include the relations to include
	 */
	 async get(
		where: GenreQueryParameters.WhereInput,
		include?: GenreQueryParameters.RelationInclude
	) {
		try {
			return await this.prismaService.genre.findFirst({
				rejectOnNotFound: true,
				where: {
					...where,
					slug: where?.slug?.toString()
				},
				include: GenreQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Find multiple genres
	 * @param where the parameters to find the genres
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include
	 */
	async getMany(
		where: GenreQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: GenreQueryParameters.RelationInclude,
		sort?: GenreQueryParameters.SortingParameter
	) {
		return this.prismaService.genre.findMany({
			where: GenreQueryParameters.buildQueryParametersForMany(where),
			include: GenreQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Count the genres that match the query parameters
	 * @param where the query parameters
	 */
	async count(where: GenreQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.genre.count({
			where: GenreQueryParameters.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Updates a genre in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the genre to update
	 * @returns the updated genre
	 */
	async update(
		what: GenreQueryParameters.UpdateInput,
		where: GenreQueryParameters.WhereInput
	): Promise<Genre> {
		try {
			return await this.prismaService.genre.update({
				data: {
					...what,
					slug: new Slug(what.name).toString(),
				},
				where: GenreQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Deletes a genre
	 * @param where the query parameter to find the genre to delete
	 */
	async delete(where: GenreQueryParameters.DeleteInput): Promise<Genre> {
		try {
			const genre = await this.prismaService.genre.delete({
				where: GenreQueryParameters.buildQueryParametersForOne(where),
			});
			Logger.warn(`Genre '${genre.slug}' deleted`);
			return genre;
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Deletes a genre
	 * @param where the query parameter to find the genre to delete
	 */
	 async deleteIfEmpty(where: GenreQueryParameters.DeleteInput): Promise<void> {
		const songCount = await this.songService.count({
			genre: where
		});
		if (songCount == 0)
			await this.delete(where);
	}

	/**
	 * Find a genre by its name, or creates one if not found
	 * @param where the query parameters to find / create the genre
	 */
	async getOrCreate(
		where: GenreQueryParameters.GetOrCreateInput,
		include?: GenreQueryParameters.RelationInclude
	) {
		try {
			return await this.get({ slug: new Slug(where.name) }, include);
		} catch {
			return this.create(where, include);
		}
	}

	buildResponse<ResponseType extends Genre>(genre: Genre & { songs?: Song[] }): ResponseType {
		let response = <ResponseType>genre;
		if (genre.songs !== undefined)
			response = {
				...response,
				songs: genre.songs.map(
					(song) => this.songService.buildResponse(song)
				)
			}
		return response;
	}

	onNotFound(where: GenreQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new GenreNotFoundByIdException(where.id);
		return new GenreNotFoundException(where.slug);
	}
}
