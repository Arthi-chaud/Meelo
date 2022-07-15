import { Controller, forwardRef, Get, Inject, Param, Query, Response } from '@nestjs/common';
import IllustrationService from 'src/illustration/illustration.service';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import Slug from 'src/slug/slug';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import ParseAlbumIdentifierPipe from './album.pipe';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';


@Controller('albums')
export default class AlbumController {
	constructor(
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,

	) {}

	@Get()
	async getAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		const albums = await this.albumService.getAlbums({}, paginationParameters, include);
		return albums.map((album) => this.albumService.buildAlbumResponse(album));
	}

	@Get(`${compilationAlbumArtistKeyword}`)
	async getCompilationsAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		const albums = await this.albumService.getAlbums({ byArtist: null }, paginationParameters, include);
		return albums.map((album) => this.albumService.buildAlbumResponse(album));
	}

	@Get(':idOrSlug')
	async getAlbum(
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		const album = await this.albumService.getAlbum(where, include);
		return this.albumService.buildAlbumResponse(album);
	}

	@Get(':idOrSlug/master')
	async getAlbumMaster(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		let masterRelease = await this.releaseService.getMasterRelease(where, include);
		return this.releaseService.buildReleaseResponse(masterRelease);
	}

	@Get(':idOrSlug/releases')
	async getAlbumReleases(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		let releases = await this.releaseService.getAlbumReleases(where, paginationParameters, include);
		return releases.map((release) => this.releaseService.buildReleaseResponse(release));
	}

	@Get(':idOrSlug/illustration')
	async getAlbumIllustration(
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response
	) {
		const album = await this.albumService.getAlbum(where, { artist: true });
		return this.illustrationService.streamIllustration(
			await this.illustrationService.buildMasterReleaseIllustrationPath(
				new Slug(album.slug), album.artist ? new Slug(album.artist.slug) : undefined
			),
			album.slug, res
		);
	}

}