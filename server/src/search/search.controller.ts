import {
	Controller, Get, Param, Query
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SearchService from './search.service';
import { AlbumResponseBuilder } from 'src/album/models/album.response';
import { SongResponseBuilder } from 'src/song/models/song.response';
import { ReleaseResponseBuilder } from 'src/release/models/release.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Response, { ResponseType } from 'src/response/response.decorator';
import { ArtistResponseBuilder } from 'src/artist/models/artist.response';
import { Genre } from 'src/prisma/models';
import { SearchAllResponseBuilder } from './models/search-all.response';

@ApiTags("Search")
@Controller('search')
export default class SearchController {
	constructor(
		private searchService: SearchService,
	) {}

	@ApiOperation({
		summary: 'Search items by their names'
	})
	@Response({ handler: SearchAllResponseBuilder })
	@Get('/all/:query')
	async searchItems(
		@Param('query')
		query: string,
	) {
		return {
			artists: await this.searchService.searchArtists(query),
			albums: await this.searchService.searchAlbums(query),
			songs: await this.searchService.searchSongs(query),
			releases: await this.searchService.searchReleases(query),
			genres: await this.searchService.searchGenres(query)
		};
	}

	@ApiOperation({
		summary: 'Search album artists by their names'
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page
	})
	@Get('/artists/:query')
	async searchArtists(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter
	) {
		return this.searchService.searchArtists(
			query, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Search albums by their names'
	})
	@Response({
		handler: AlbumResponseBuilder,
		type: ResponseType.Page
	})
	@Get('/albums/:query')
	async searchAlbums(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter
	) {
		return this.searchService.searchAlbums(
			query, filter.type, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Search songs by their names'
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page
	})
	@Get('/songs/:query')
	async searchSongs(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter
	) {
		return this.searchService.searchSongs(
			query, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Search releases by their names'
	})
	@Response({
		handler: ReleaseResponseBuilder,
		type: ResponseType.Page
	})
	@Get('/releases/:query')
	async searchRelease(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter
	) {
		return this.searchService.searchReleases(
			query, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Search genres by their names'
	})
	@Response({
		returns: Genre,
		type: ResponseType.Page
	})
	@Get('/genres/:query')
	async searchGenres(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
		@SortingQuery(GenreQueryParameters.SortingKeys)
		sortingParameter: GenreQueryParameters.SortingParameter
	) {
		return this.searchService.searchGenres(
			query, paginationParameters, include, sortingParameter
		);
	}
}
