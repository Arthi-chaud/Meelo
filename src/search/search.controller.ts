import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import ArtistService from 'src/artist/artist.service';
import AlbumService from 'src/album/album.service';
import GenreService from 'src/genre/genre.service';
import ReleaseService from 'src/release/release.service';
import SongService from 'src/song/song.service';

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
	) {
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
		const artists = await this.searchService.searchArtists(query, paginationParameters, include);
		return new PaginatedResponse(
			await Promise.all(artists.map((artist) => this.artistService.buildResponse(artist))),
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
		const albums = await this.searchService.searchAlbums(query, paginationParameters, include)
		return new PaginatedResponse(
			await Promise.all(albums.map((album) => this.albumService.buildResponse(album))),
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
		const songs = await this.searchService.searchSongs(query, paginationParameters, include);
		return new PaginatedResponse(
			await Promise.all(songs.map((song) => this.songService.buildResponse(song))),
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
		const releases = await this.searchService.searchReleases(query, paginationParameters, include)
		return new PaginatedResponse(
			await Promise.all(releases.map((release) => this.releaseService.buildResponse(release))),
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
		const genres = await this.searchService.searchGenres(query, paginationParameters, include);
		return new PaginatedResponse(
			await Promise.all(genres.map((genre) => this.genreService.buildResponse(genre))),
			request
		)
	}
}
