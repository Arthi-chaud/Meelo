import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import TrackQueryParameters from './models/track.query-parameters';
import TrackService from './track.service';

@Controller('track')
export class TrackController {
	constructor(private trackService: TrackService) { }
	
	@Get()
	async getTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude
	) {
		return await this.trackService.getTracks({}, paginationParameters, include);
	}

	@Get('/:id')
	async getTrack(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		trackId: number
	) {
		return await this.trackService.getTrack({ id: trackId }, include);
	}
}
