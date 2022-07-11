import { Controller, forwardRef, Get, Inject, Param, ParseIntPipe, Query, Redirect } from '@nestjs/common';
import { UrlGeneratorService } from 'nestjs-url-generator';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import { TrackController } from 'src/track/track.controller';
import TrackService from 'src/track/track.service';
import SongQueryParameters from './models/song.query-params';
import SongService from './song.service';



@Controller('songs')
export class SongController {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	@Get()
	async getSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude
	) {
		let songs = await this.songService.getSongs({}, paginationParameters, include);
		return songs;
	}

	@Get(':id')
	async getSong(
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		songId: number
	) {
		let song = await this.songService.getSong({ byId: {  id: songId } }, include);
		return song;
	}

	@Get(':id/master')
	async getSongMaster(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		songId: number
	) {
		let master = await this.trackService.getMasterTrack({
			byId: {  id: songId }
		}, include);
		return master;
	}

	@Get(':id/tracks')
	async getSongTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		songId: number
	) {
		let tracks = await this.trackService.getSongTracks({
			byId: {  id: songId }
		}, paginationParameters, include);
		return tracks;
	}

	@Get(':id/illustration')
	@Redirect()
	async getSongIllustration(
		@Param('id', ParseIntPipe)
		songId: number
	) {
		let master = await this.trackService.getMasterTrack({
			byId: {  id: songId }
		});
		const illustrationRedirectUrl = this.urlGeneratorService.generateUrlFromController({
			controller: TrackController,
			controllerMethod: TrackController.prototype.getTrackIllustration,
			params: {
				id: master.id.toString()
			}
			
		})
		return { url: illustrationRedirectUrl };
	}
}