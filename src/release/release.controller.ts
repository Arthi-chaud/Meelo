import { Body, Controller, forwardRef, Get, Inject, Param, Post, Query, Req, Response } from '@nestjs/common';
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
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ParseReleaseIdentifierPipe from './release.pipe';
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';


@Controller('releases')
export default class ReleaseController {
	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService
	) { }
	
	@Get()
	async getReleases(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		const releases = await this.releaseService.getReleases({}, paginationParameters, include);
		return new PaginatedResponse(
			releases.map(
				(release) => this.releaseService.buildReleaseResponse(release)
			),
			request
		);
	}

	@Get(':idOrSlug')
	async getRelease(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = await this.releaseService.getRelease(where, include);
		return this.releaseService.buildReleaseResponse(release);
	}

	@Get(':idOrSlug/tracks')
	async getReleaseTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const tracks = await this.trackService.getTracks({
			byRelease: where
		}, paginationParameters, include);
		if (tracks.length == 0)
			await this.releaseService.getRelease(where);
		return new PaginatedResponse(
			tracks.map(
				(track) => this.trackService.buildTrackResponse(track)
			),
			request
		);
	}

	@Get(':idOrSlug/album')
	async getReleaseAlbum(
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = this.releaseService.getRelease(where);
		const album = await this.albumService.getAlbum({
			byId: { id: (await release).albumId }
		}, include);
		return this.albumService.buildAlbumResponse(album);

	}

	@Get(':idOrSlug/illustration')
	async getReleaseIllustration(
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response
	) {
		let release = await this.releaseService.getRelease(where);
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

	@Post('/:idOrSlug/illustration')
	async updateReleaseIllustration(
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let release = await this.releaseService.getRelease(where);
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