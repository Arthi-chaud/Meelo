import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { Album } from '@prisma/client';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';


@Controller('albums')
export default class AlbumController {
	constructor(
		private albumService: AlbumService
	) {}

	@Get()
	async getAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		let albums = await this.albumService.getAlbums({}, paginationParameters, include);
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get(`/${compilationAlbumArtistKeyword}`)
	async getCompilationsAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		let albums = await this.albumService.getAlbums({ byArtist: null }, paginationParameters, include);
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:id')
	async getAlbum(
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		albumId: number
	) {
		let album = await this.albumService.getAlbum({
			byId: { id: albumId }
		}, include);
		return this.buildAlbumResponse(album);
	}

	private buildAlbumResponse(album: Album) {
		return {
			...album
		};
	}
}