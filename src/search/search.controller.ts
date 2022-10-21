import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SearchService from './search.service';
import type { Request } from 'express';
import ArtistService from 'src/artist/artist.service';
import AlbumService from 'src/album/album.service';
import GenreService from 'src/genre/genre.service';
import ReleaseService from 'src/release/release.service';
import SongService from 'src/song/song.service';
import { ArtistResponse } from 'src/artist/models/artist.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { AlbumResponse } from 'src/album/models/album.response';
import { SongResponse } from 'src/song/models/song.response';
import { ReleaseResponse } from 'src/release/models/release.response';
import { GenreResponse } from 'src/genre/models/genre.response';
import { SearchAllResponse } from './models/search-all.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';

@ApiTags("Search")
@Controller('search')
export default class SearchController {
	constructor(
		private searchService: SearchService,
		private artistService: ArtistService,
		private albumService: AlbumService,
		private songService: SongService,
		private releaseService: ReleaseService,
		private genreService: GenreService
	) {}
	
	@ApiOperation({
		summary: 'Search items by their names'
	})
	@Get('/all/:query')
	async searchItems(
		@Param('query')
		query: string,
	): Promise<SearchAllResponse> {
		return {
			artists: await Promise.all((await this.searchService.searchArtists(query))
				.map((artist) => this.artistService.buildResponse(artist))),
			albums: await Promise.all((await this.searchService.searchAlbums(query))
				.map((album) => this.albumService.buildResponse(album))),
			songs: await Promise.all((await this.searchService.searchSongs(query))
				.map((song) => this.songService.buildResponse(song))),
			releases: await Promise.all((await this.searchService.searchReleases(query))
				.map((release) => this.releaseService.buildResponse(release))),
			genres: await Promise.all((await this.searchService.searchGenres(query))
				.map((genre) => this.genreService.buildResponse(genre))),
		};
	}

	@ApiOperation({
		summary: 'Search album artists by their names'
	})
	@ApiPaginatedResponse(ArtistResponse)
	@Get('/artists/:query')
	async searchArtists(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const artists = await this.searchService.searchArtists(query, paginationParameters, include, sortingParameter);
		return new PaginatedResponse(
			await Promise.all(artists.map((artist) => this.artistService.buildResponse(artist))),
			request
		)
	}

	@ApiOperation({
		summary: 'Search albums by their names'
	})
	@ApiPaginatedResponse(AlbumResponse)
	@Get('/albums/:query')
	async searchAlbums(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request
	) {
		const albums = await this.searchService.searchAlbums(query, filter.type, paginationParameters, include, sortingParameter)
		return new PaginatedResponse(
			await Promise.all(albums.map((album) => this.albumService.buildResponse(album))),
			request
		)
	}

	@ApiOperation({
		summary: 'Search songs by their names'
	})
	@ApiPaginatedResponse(SongResponse)
	@Get('/songs/:query')
	async searchSongs(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const songs = await this.searchService.searchSongs(query, paginationParameters, include, sortingParameter);
		return new PaginatedResponse(
			await Promise.all(songs.map((song) => this.songService.buildResponse(song))),
			request
		)
	}

	@ApiOperation({
		summary: 'Search releases by their names'
	})
	@ApiPaginatedResponse(ReleaseResponse)
	@Get('/releases/:query')
	async searchRelease(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const releases = await this.searchService.searchReleases(query, paginationParameters, include, sortingParameter)
		return new PaginatedResponse(
			await Promise.all(releases.map((release) => this.releaseService.buildResponse(release))),
			request
		)
	}

	@ApiOperation({
		summary: 'Search genres by their names'
	})
	@ApiPaginatedResponse(GenreResponse)
	@Get('/genres/:query')
	async searchGenres(
		@Param('query')
		query: string,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(GenreQueryParameters.AvailableIncludes)
		include: GenreQueryParameters.RelationInclude,
		@SortingQuery(GenreQueryParameters.SortingKeys)
		sortingParameter: GenreQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const genres = await this.searchService.searchGenres(query, paginationParameters, include, sortingParameter);
		return new PaginatedResponse(
			await Promise.all(genres.map((genre) => this.genreService.buildResponse(genre))),
			request
		)
	}
}
