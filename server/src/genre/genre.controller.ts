import {
	Controller, Get, Inject, forwardRef
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import GenreService from "./genre.service";
import GenreQueryParameters from "./models/genre.query-parameters";
import { SongResponseBuilder } from "src/song/models/song.response";
import { ArtistResponseBuilder } from "src/artist/models/artist.response";
import { PaginationQuery } from "src/pagination/pagination-query.decorator";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import SortingQuery from "src/sort/sort-query.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";
import { Genre } from "src/prisma/models";

@ApiTags("Genres")
@Controller('genres')
export class GenreController {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		private genreService: GenreService
	) {}

	@ApiOperation({
		summary: 'Get all genres'
	})
	@Get()
	@Response({
		returns: Genre,
		type: ResponseType.Page
	})
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
		@SortingQuery(GenreQueryParameters.SortingKeys)
		sortingParameter: GenreQueryParameters.SortingParameter
	) {
		return this.genreService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get a genre'
	})
	@Response({ returns: Genre })
	@Get(':idOrSlug')
	async get(
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
		@IdentifierParam(GenreService)
		where: GenreQueryParameters.WhereInput
	) {
		return this.genreService.get(where, include);
	}

	@ApiOperation({
		summary: 'Get all songs with at least one song from the genre'
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/songs')
	async getGenreSongs(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@IdentifierParam(GenreService)
		where: GenreQueryParameters.WhereInput
	) {
		const songs = await this.songService.getMany(
			{ genre: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.genreService.throwIfNotFound(where);
		}
		return songs;
	}

	@ApiOperation({
		summary: 'Get all artists with at least one song from the genre'
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/artists')
	async getGenreArtists(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@IdentifierParam(GenreService)
		where: GenreQueryParameters.WhereInput
	) {
		const artists = await this.artistService.getMany(
			{ genre: where }, paginationParameters, include, sortingParameter
		);

		if (artists.length == 0) {
			await this.genreService.throwIfNotFound(where);
		}
		return artists;
	}
}
