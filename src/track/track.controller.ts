import { Controller, Get, Query, Param, Post, Body, Inject, forwardRef, Req } from '@nestjs/common';
import { ParseIdPipe } from 'src/identifier/id.pipe';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
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
		private trackService: TrackService
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
