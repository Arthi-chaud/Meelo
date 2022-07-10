import { Controller, forwardRef, Get, Inject, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';


@Controller('albums')
export default class AlbumController {
	constructor(
		private albumService: AlbumService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService

	) {}

	@Get()
	async getAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		let albums = await this.albumService.getAlbums({}, paginationParameters, include);
		return albums;
	}

	@Get(`/${compilationAlbumArtistKeyword}`)
	async getCompilationsAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		let albums = await this.albumService.getAlbums({ byArtist: null }, paginationParameters, include);
		return albums;
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
		return album;
	}

	@Get('/:id/master')
	async getAlbumMaster(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		albumId: number
	) {
		let masterRelease = await this.releaseService.getMasterRelease({
			byId: { id: albumId }
		}, include);
		return masterRelease;
	}

	@Get('/:id/releases')
	async getAlbumReleases(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		albumId: number
	) {
		let releases = await this.releaseService.getAlbumReleases({
			byId: { id: albumId }
		}, paginationParameters, include);
		return releases;
	}

}