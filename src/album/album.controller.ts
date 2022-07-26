import { Controller, forwardRef, Get, Inject, Param, Query, Req, Response } from '@nestjs/common';
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
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';

@ApiTags("Albums")
@Controller('albums')
export default class AlbumController {
	constructor(
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,

	) {}

	@ApiOperation({
		summary: 'Get all albums'
	})
	@Get()
	async getMany(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all compilations albums'
	})
	@Get(`${compilationAlbumArtistKeyword}`)
	async getCompilationsAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{ byArtist: { compilationArtist: true } }, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get one album'
	})
	@Get(':idOrSlug')
	async get(
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		const album = await this.albumService.get(where, include);
		return this.albumService.buildResponse(album);
	}

	@ApiOperation({
		summary: 'Get the master release of an album'
	})
	@Get(':idOrSlug/master')
	async getAlbumMaster(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		let masterRelease = await this.releaseService.getMasterRelease(where, include);
		return this.releaseService.buildResponse(masterRelease);
	}

	@ApiOperation({
		summary: 'Get the tracklist of master release of an album'
	})
	@Get(':idOrSlug/master/tracklist')
	async getAlbumTracklist(
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
	) {
		const masterRelease = await this.releaseService.getMasterRelease(where);
		const tracklist = await this.trackService.getTracklist(
			{ byId: { id: masterRelease.id } }, include
		);
		return this.trackService.buildTracklistResponse(tracklist);
	}

	@ApiOperation({
		summary: 'Get all the releases of an album'
	})
	@Get(':idOrSlug/releases')
	async getAlbumReleases(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Query(ReleaseQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Req() request: Request
	) {
		let releases = await this.releaseService.getAlbumReleases(
			where, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			releases.map((release) => this.releaseService.buildResponse(release)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an album'
	})
	@Get(':idOrSlug/videos')
	async getAlbumVideos(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ byAlbum: where, type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		if (videoTracks.length == 0)
			await this.albumService.get(where);
		return new PaginatedResponse(
			videoTracks.map((videoTrack) => this.trackService.buildResponse(videoTrack)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get the album\'s illustration'
	})
	@Get(':idOrSlug/illustration')
	async getAlbumIllustration(
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response
	) {
		const album = await this.albumService.get(where, { artist: true });
		return this.illustrationService.streamIllustration(
			await this.illustrationService.buildMasterReleaseIllustrationPath(
				new Slug(album.slug), album.artist ? new Slug(album.artist.slug) : undefined
			),
			album.slug, res
		);
	}

}