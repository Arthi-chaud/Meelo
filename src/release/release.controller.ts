import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from './models/release.query-parameters';
import ReleaseService from './release.service';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';


@Controller('releases')
export default class ReleaseController {
	constructor(
		private releaseService: ReleaseService,
		private trackService: TrackService
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
}