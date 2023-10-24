import {
	Controller, Get, Query
} from "@nestjs/common";
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from "@nestjs/swagger";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import GenreService from "./genre.service";
import GenreQueryParameters from "./models/genre.query-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
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
		@Query()
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
}
