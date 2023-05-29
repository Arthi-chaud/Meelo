import {
	Controller, Get, Inject, Query, forwardRef
} from "@nestjs/common";
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from "@nestjs/swagger";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import GenreService from "./genre.service";
import GenreQueryParameters from "./models/genre.query-parameters";
import { SongResponseBuilder } from "src/song/models/song.response";
import { PaginationQuery } from "src/pagination/pagination-query.decorator";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import SortingQuery from "src/sort/sort-query.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";
import { Genre } from "src/prisma/models";
import { IsOptional } from "class-validator";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import AlbumService from "src/album/album.service";
import TransformIdentifier from "src/identifier/identifier.transform";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import ArtistService from "src/artist/artist.service";

class Selector extends IntersectionType(GenreQueryParameters.SortingParameter) {
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Search genres using a string token'
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter genres by album'
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter genres by artist'
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter genres by song'
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;
}

@ApiTags("Genres")
@Controller('genres')
export class GenreController {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		private genreService: GenreService
	) {}

	@ApiOperation({
		summary: 'Get many genres'
	})
	@Get()
	@Response({
		returns: Genre,
		type: ResponseType.Page
	})
	async getMany(
		@Query() selector: Selector,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.genreService.getMany(
				{ ...selector, slug: { contains: selector.query } },
				paginationParameters,
				include,
				selector
			);
		}
		return this.genreService.getMany(
			selector,
			paginationParameters,
			include,
			selector
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
}
