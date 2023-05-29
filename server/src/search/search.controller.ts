import {
	Controller, Get, Param
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import Response from 'src/response/response.decorator';
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
	@Get(':query')
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
}
