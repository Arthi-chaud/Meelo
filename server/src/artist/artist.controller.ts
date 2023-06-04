import {
	Controller, Get, Inject, Query, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from '@nestjs/swagger';
import { ArtistResponseBuilder } from './models/artist.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import Response, { ResponseType } from 'src/response/response.decorator';
import { IsOptional } from 'class-validator';
import TransformIdentifier from 'src/identifier/identifier.transform';
import GenreService from 'src/genre/genre.service';
import LibraryService from 'src/library/library.service';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import AlbumService from 'src/album/album.service';

class Selector extends IntersectionType(ArtistQueryParameters.SortingParameter) {
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Search artists using a string token'
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'If true, only artists that have at least one album will be returned'
	})
	albumArtistOnly?: boolean;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter artists by genre'
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter artists by library'
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter artists by albums they appear on'
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;
}

@ApiTags("Artists")
@Controller('artists')
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
	) {}

	@ApiOperation({
		summary: 'Get many artists'
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query() selector: Selector,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.artistService.search(
				selector.query,
				selector,
				paginationParameters,
				include,
				selector
			);
		}
		return this.artistService.getMany(
			selector,
			paginationParameters,
			include,
			selector
		);
	}

	@ApiOperation({
		summary: 'Get one artist'
	})
	@Response({
		handler: ArtistResponseBuilder
	})
	@Get(':idOrSlug')
	async get(
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
	) {
		return this.artistService.get(where, include);
	}
}
