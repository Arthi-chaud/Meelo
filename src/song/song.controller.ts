import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import ParseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import { ParseSlugPipe } from 'src/slug/pipe';
import type Slug from 'src/slug/slug';
import SongQueryParameters from './models/song.query-params';
import SongService from './song.service';

const ParseSongRelationIncludePipe = new ParseRelationIncludePipe(SongQueryParameters.AvailableIncludes);


@Controller('songs')
export class SongController {
	constructor(
		private songService: SongService
	) {}

	@Get()
	async getSongs(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseSongRelationIncludePipe) include: SongQueryParameters.RelationInclude
	) {
		let songs = await this.songService.getSongs({}, paginationParameters, include);
		return songs;
	}

	@Get('/:id')
	async getSong(
		@Query('with', ParseSongRelationIncludePipe) include: SongQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe) songId: number
	) {
		let song = await this.songService.getSong({ byId: {  id: songId } }, include);
		return song;
	}

	@Get('/:artist')
	async getSongsbyArtist(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseSongRelationIncludePipe) include: SongQueryParameters.RelationInclude,
		@Param('artist', ParseSlugPipe) artistSlug: Slug
	) {
		let songs = await this.songService.getSongs({
			artist: { slug: artistSlug }
		}, paginationParameters, include);
		return songs;
	}
}