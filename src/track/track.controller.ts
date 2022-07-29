import { Controller, Get, Query, Param, Response, Post, Body, Inject, forwardRef, Req } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import { ParseIdPipe } from 'src/identifier/id.pipe';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationDownloadDto } from 'src/illustration/models/illustration-dl.dto';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import Slug from 'src/slug/slug';
import TrackQueryParameters from './models/track.query-parameters';
import TrackService from './track.service';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';
import type ReassignTrackDTO from './models/reassign-track.dto';

@ApiTags("Tracks")
@Controller('tracks')
export class TrackController {
	constructor(
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService
	) { }
	
	@ApiOperation({
		summary: 'Get all tracks'
	})
	@Get()
	async getMany(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const tracks = await this.trackService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			tracks.map((track) => this.trackService.buildResponse(track)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the video tracks'
	})
	@Get('videos')
	async getVideoTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		return new PaginatedResponse(
			videoTracks.map((videoTrack) => this.trackService.buildResponse(videoTrack)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a track'
	})
	@Get(':id')
	async get(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIdPipe)
		trackId: number
	) {
		const track = await this.trackService.get({ id: trackId }, include);
		return this.trackService.buildResponse(track);
	}

	@ApiOperation({
		summary: 'Get a track\'s illustration'
	})
	@Get(':id/illustration')
	async getTrackIllustration(
		@Param('id', ParseIdPipe)
		trackId: number,
		@Response({ passthrough: true })
		res: Response
	) {
		let track = await this.trackService.get({ id: trackId }, { release: true });
		let album = await this.albumService.get({ byId: { id: track.release.albumId } }, { artist: true })
		const trackIllustrationPath = this.illustrationService.buildTrackIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		const releaseIllustratioPath = this.illustrationService.buildReleaseIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined
		);
		try {
			return this.illustrationService.streamIllustration(
				trackIllustrationPath,
				new Slug(track.displayName).toString(), res
			);
		} catch {
			return this.illustrationService.streamIllustration(
				releaseIllustratioPath,
				new Slug(track.displayName).toString(), res
			);
		}
	}

	@ApiOperation({
		summary: 'Change a track\'s illustration'
	})
	@Post('/:id/illustration')
	async updateTrackIllustration(
		@Param('id', ParseIdPipe)
		trackId: number,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let track = await this.trackService.get({ id: trackId }, { release: true });
		let album = await this.albumService.get({ byId: { id: track.release.albumId } }, { artist: true })
		const trackIllustrationPath = this.illustrationService.buildTrackIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			trackIllustrationPath
		);
	}

	@ApiOperation({
		summary: 'Change the track\'s parent song'
	})
	@Post('reassign')
	async reassignTrack(
		@Body() reassignmentDTO: ReassignTrackDTO
	) {
		return this.trackService.buildResponse(
			await this.trackService.reassign(
			{ id: reassignmentDTO.trackId },
			{ byId: { id: reassignmentDTO.songId } }
		));
	}
}
