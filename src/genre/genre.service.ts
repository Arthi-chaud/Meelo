import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import Slug from 'src/slug/slug';
import { GenreAlreadyExistsException, GenreNotFoundByIdException, GenreNotFoundException } from './genre.exceptions';
import type GenreQueryParameters from './models/genre.query-parameters';
import type { Genre, GenreWithRelations } from 'src/prisma/models';
import SongService from 'src/song/song.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import type SongQueryParameters from "../song/models/song.query-params";
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import ArtistService from 'src/artist/artist.service';
import { Prisma } from '@prisma/client';
import { GenreResponse } from './models/genre.response';

@Injectable()
export default class GenreService extends RepositoryService<
	GenreWithRelations,
	GenreQueryParameters.CreateInput,
	GenreQueryParameters.WhereInput,
	GenreQueryParameters.ManyWhereInput,
	GenreQueryParameters.UpdateInput,
	GenreQueryParameters.DeleteInput,
	Prisma.GenreCreateInput,
	Prisma.GenreWhereInput,
	Prisma.GenreWhereInput,
	Prisma.GenreUpdateInput,
	Prisma.GenreWhereUniqueInput
> {
	constructor(
		prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {
		super (prismaService.genre);
	}
	/**
	 * Create
	 */
	formatCreateInput(input: GenreQueryParameters.CreateInput): Prisma.GenreCreateInput {
		return {
			...input,
			slug: new Slug(input.name).toString()
		}
	}
	protected formatCreateInputToWhereInput(input: GenreQueryParameters.CreateInput): GenreQueryParameters.WhereInput {
		return { slug: new Slug(input.name) }
	}
	protected onCreationFailure(input: GenreQueryParameters.CreateInput) {
		return new GenreAlreadyExistsException(new Slug(input.name));
	}

	/**
	 * Find a genre
	 */
	static formatWhereInput(input: GenreQueryParameters.WhereInput) {
		return {
			...input,
			slug: input?.slug?.toString()
		}
	}
	formatWhereInput = GenreService.formatWhereInput;

	static formatManyWhereInput(where: GenreQueryParameters.ManyWhereInput) {
		return {
			name: where.byName
				? buildStringSearchParameters(where.byName)
				: undefined,
			songs: where.bySong || where.byArtist ? {
				some: where.bySong
					? SongService.formatWhereInput(where.bySong)
					: where.byArtist
						? { artist: ArtistService.formatWhereInput(where.byArtist) }
						: undefined
			} : undefined,
			
		}
	}
	formatManyWhereInput = GenreService.formatManyWhereInput;

	/**
	 * Update a genre
	 */
	formatUpdateInput(what: GenreQueryParameters.CreateInput) {
		return {
			...what,
			slug: new Slug(what.name).toString(),
		}
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
		const deleted = await super.delete(where);
		Logger.warn(`Genre '${deleted.slug}' deleted`);
		return deleted;
	}
	/**
	 * Deletes a genre, if empty
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
	 * Find the song's genres
	 * @param where the query parameters to find the song
	 */
	async getSongGenres(
		where: SongQueryParameters.WhereInput,
		include?: GenreQueryParameters.RelationInclude,
		sort?: GenreQueryParameters.SortingParameter
	) {
		const genres = await this.getMany({ bySong: where }, {}, include, sort);
		if (genres.length == 0)
			await this.songService.throwIfNotFound(where);
		return genres;
	}

	async buildResponse(genre: GenreWithRelations): Promise<GenreResponse> {
		let response = <GenreResponse>genre;
		if (genre.songs !== undefined)
			response.songs = await Promise.all(genre.songs.map(
				(song) => this.songService.buildResponse(song)
			));
		return response;
	}

	onNotFound(where: GenreQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new GenreNotFoundByIdException(where.id);
		return new GenreNotFoundException(where.slug);
	}
}
