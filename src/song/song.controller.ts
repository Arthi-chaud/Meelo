import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import SongQueryParameters from './models/song.query-params';
import SongService from './song.service';



@Controller('songs')
export class SongController {
	constructor(
		private songService: SongService
	) {}

	@Get()
	async getSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude
	) {
		let songs = await this.songService.getSongs({}, paginationParameters, include);
		return songs;
	}

	@Get('/:id')
	async getSong(
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		songId: number
	) {
		let song = await this.songService.getSong({ byId: {  id: songId } }, include);
		return song;
	}
}