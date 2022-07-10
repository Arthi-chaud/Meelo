import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Response } from '@nestjs/common';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from './models/release.query-parameters';
import ReleaseService from './release.service';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import IllustrationService from 'src/illustration/illustration.service';
import AlbumService from 'src/album/album.service';
import Slug from 'src/slug/slug';
import type { IllustrationDownloadDto } from 'src/illustration/models/illustration-dl.dto';


@Controller('releases')
export default class ReleaseController {
	constructor(
		private releaseService: ReleaseService,
		private trackService: TrackService,
		private albumService: AlbumService,
		private illustrationService: IllustrationService
	) { }
	
	@Get()
	async getReleases(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude
	) {
		return await this.releaseService.getReleases({}, paginationParameters, include);
	}

	@Get('/:id')
	async getRelease(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		releaseId: number
	) {
		return await this.releaseService.getRelease({ byId: { id: releaseId } }, include);
	}

	@Get('/:id/tracks')
	async getReleaseTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		releaseId: number
	) {
		return await this.trackService.getTracks({
			byRelease: { byId: { id: releaseId } }
		}, paginationParameters, include);
	}

	@Get('/:id/illustration')
	async getReleaseIllustration(
		@Param('id', ParseIntPipe)
		releaseId: number,
		@Response({ passthrough: true })
		res: Response
	) {
		let release = await this.releaseService.getRelease({ byId: { id: releaseId } });
		let album = await this.albumService.getAlbum({ byId: { id: release.albumId } }, { artist: true })
		return this.illustrationService.streamIllustration(
			this.illustrationService.buildReleaseIllustrationPath(
				new Slug(album.slug),
				new Slug(release.slug),
				album.artist ? new Slug(album.artist.slug) : undefined
			),
			release.slug, res
		);
	}

	@Post('/:id/illustration')
	async updateReleaseIllustration(
		@Param('id', ParseIntPipe)
		releaseId: number,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let release = await this.releaseService.getRelease({ byId: { id: releaseId } });
		let album = await this.albumService.getAlbum({ byId: { id: release.albumId } }, { artist: true })
		const releaseIllustrationPath = this.illustrationService.buildReleaseIllustrationPath(
			new Slug(album.slug),
			new Slug(release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined
		);
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			releaseIllustrationPath
		);
	}
}