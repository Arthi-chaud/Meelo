import {
	Controller, Get, Param
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import { SongResponseBuilder } from 'src/song/models/song.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Response, { ResponseType } from 'src/response/response.decorator';
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
			albums: await this.albumService.search(query, {}),
			songs: await this.songService.search(query, {}),
			genres: await this.genreService.getMany({ slug: { contains: query } })
		};
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
}
