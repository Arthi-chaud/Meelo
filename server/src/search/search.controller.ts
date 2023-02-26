import {
	Controller, Get, Param, Query
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import { AlbumResponseBuilder } from 'src/album/models/album.response';
import { SongResponseBuilder } from 'src/song/models/song.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Response, { ResponseType } from 'src/response/response.decorator';
import { ArtistResponseBuilder } from 'src/artist/models/artist.response';
import { Genre } from 'src/prisma/models';
import { SearchAllResponseBuilder } from './models/search-all.response';
import AlbumService from 'src/album/album.service';
import ArtistService from 'src/artist/artist.service';
import GenreService from 'src/genre/genre.service';
import SongService from 'src/song/song.service';

@ApiTags("Search")
@Controller('search')
export default class SearchController {
	constructor(
		private artistService: ArtistService,
		private albumService: AlbumService,
		private songService: SongService,
		private genreService: GenreService,
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
			artists: await this.artistService.search(query, {}),
			albums: await this.albumService.getMany({ name: { contains: query } }),
			songs: await this.songService.search(query, {}),
			genres: await this.genreService.getMany({ name: { contains: query } })
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
		return this.artistService.search(
			query, {}, paginationParameters, include, sortingParameter
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
		return this.albumService.getMany(
			{ name: { contains: query }, type: filter.type },
			paginationParameters,
			include,
			sortingParameter
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
		return this.songService.search(
			query, {}, paginationParameters, include, sortingParameter
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
		return this.genreService.getMany(
			{ name: { contains: query } }, paginationParameters, include, sortingParameter
		);
	}
}
