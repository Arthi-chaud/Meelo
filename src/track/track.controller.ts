import { Controller, Get, Query, Param, Post, Body, Inject, forwardRef, Req, Put } from '@nestjs/common';
import { ParseIdPipe } from 'src/identifier/id.pipe';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import TrackQueryParameters from './models/track.query-parameters';
import TrackService from './track.service';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';
import ReassignTrackDTO from './models/reassign-track.dto';
import { TrackResponse } from './models/track.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';

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
	@ApiPaginatedResponse(TrackResponse)
	async getMany(
		@PaginationQuery()
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
			await Promise.all(tracks.map((track) => this.trackService.buildResponse(track))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the video tracks'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get('videos')
	async getVideoTracks(
		@PaginationQuery()
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
			await Promise.all(videoTracks.map((videoTrack) => this.trackService.buildResponse(videoTrack))),
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
		return await this.trackService.buildResponse(track);
	}

	@ApiOperation({
		summary: 'Set a track as master track'
	})
	@Put(':id/master')
	async setAsMaster(
		@Param('id', ParseIdPipe) trackId: number
	) {
		const track = await this.trackService.get({ id: trackId });
		await this.trackService.setTrackAsMaster({
			trackId: track.id,
			song: { byId: { id: track.songId } }
		});
		const updatedTrack = await this.trackService.getMasterTrack({ byId: { id: track.songId } });
		return await this.trackService.buildResponse(updatedTrack);
	}

	@ApiOperation({
		summary: 'Change the track\'s parent song'
	})
	@Post('reassign')
	async reassignTrack(
		@Body() reassignmentDTO: ReassignTrackDTO
	) {
		return await this.trackService.buildResponse(
			await this.trackService.reassign(
			{ id: reassignmentDTO.trackId },
			{ byId: { id: reassignmentDTO.songId } }
		));
	}
}
