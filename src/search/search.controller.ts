import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SearchService from './search.service';
import type { Request } from 'express';

@Controller('search')
export default class SearchController {
	constructor(
		private searchService: SearchService
	) {}
	
	@ApiOperation({
		summary: 'Search items by their names'
	})
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
			genres: await this.searchService.searchGenres(query),
		};
	}

	@ApiOperation({
		summary: 'Search album artists by their names'
	})
	@Get('/artists/:query')
	async searchArtists(
		@Param('query')
		query: string,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			await this.searchService.searchArtists(query, paginationParameters, include),
			request
		)
	}

	@ApiOperation({
		summary: 'Search albums by their names'
	})
	@Get('/albums/:query')
	async searchAlbums(
		@Param('query')
		query: string,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			await this.searchService.searchAlbums(query, paginationParameters, include),
			request
		)
	}

	@ApiOperation({
		summary: 'Search songs by their names'
	})
	@Get('/songs/:query')
	async searchSongs(
		@Param('query')
		query: string,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			await this.searchService.searchSongs(query, paginationParameters, include),
			request
		)
	}

	@ApiOperation({
		summary: 'Search releases by their names'
	})
	@Get('/releases/:query')
	async searchRelease(
		@Param('query')
		query: string,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			await this.searchService.searchReleases(query, paginationParameters, include),
			request
		)
	}

	@ApiOperation({
		summary: 'Search genres by their names'
	})
	@Get('/genres/:query')
	async searchGenres(
		@Param('query')
		query: string,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', GenreQueryParameters.ParseRelationIncludePipe)
		include: GenreQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			await this.searchService.searchGenres(query, paginationParameters, include),
			request
		)
	}
}
