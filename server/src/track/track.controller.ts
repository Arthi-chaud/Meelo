import {
	Body, Controller, Get, Inject, Post, Put, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import TrackQueryParameters from './models/track.query-parameters';
import TrackService from './track.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';
import ReassignTrackDTO from './models/reassign-track.dto';
import { TrackResponseBuilder } from './models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';

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
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page
	})
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter
	) {
		return this.trackService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get all the video tracks'
	})
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page
	})
	@Get('videos')
	async getVideoTracks(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter
	) {
		const videoTracks = await this.trackService.getMany(
			{ type: TrackType.Video }, paginationParameters, include, sortingParameter,
		);

		return videoTracks;
	}

	@ApiOperation({
		summary: 'Get a track'
	})
	@Response({ handler: TrackResponseBuilder })
	@Get(':idOrSlug')
	async get(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		return this.trackService.get(where, include);
	}

	@ApiOperation({
		summary: 'Set a track as master track'
	})
	@Admin()
	@Response({ handler: TrackResponseBuilder })
	@Put(':idOrSlug/master')
	async setAsMaster(
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		const track = await this.trackService.get(where);

		await this.trackService.setTrackAsMaster({
			trackId: track.id,
			song: { id: track.songId }
		});
		return this.trackService.getMasterTrack({ id: track.songId });
	}

	@ApiOperation({
		summary: 'Change the track\'s parent song'
	})
	@Admin()
	@Response({ handler: TrackResponseBuilder })
	@Post('reassign')
	async reassignTrack(
		@Body() reassignmentDTO: ReassignTrackDTO
	) {
		return this.trackService.reassign(
			{ id: reassignmentDTO.trackId },
			{ id: reassignmentDTO.songId }
		);
	}
}
