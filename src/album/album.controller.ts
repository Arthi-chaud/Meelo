import { Controller, forwardRef, Get, Inject, Param, ParseIntPipe, Query, Response } from '@nestjs/common';
import IllustrationService from 'src/illustration/illustration.service';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import Slug from 'src/slug/slug';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';


@Controller('albums')
export default class AlbumController {
	constructor(
		private albumService: AlbumService,
		private illustrationService: IllustrationService,
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

	@Get('/:id/illustration')
	async getAlbumIllustration(
		@Param('id', ParseIntPipe)
		albumId: number,
		@Response({ passthrough: true })
		res: Response
	) {
		let album = await this.albumService.getAlbum({ byId: { id: albumId } }, { artist: true });
		return this.illustrationService.streamIllustration(
			await this.illustrationService.buildMasterReleaseIllustrationPath(
				new Slug(album.slug), album.artist ? new Slug(album.artist.slug) : undefined
			),
			album.slug, res
		);
	}

}