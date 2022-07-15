import { Controller, forwardRef, Get, Inject, Param, Query, Redirect } from '@nestjs/common';
import { UrlGeneratorService } from 'nestjs-url-generator';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import { ParseIdPipe } from 'src/identifier/id.pipe';
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
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
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
		return songs.map((song) => this.songService.buildSongResponse(song));
	}

	@Get(':id')
	async getSong(
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param('id', ParseIdPipe)
		songId: number
	) {
		let song = await this.songService.getSong({ byId: {  id: songId } }, include);
		return this.songService.buildSongResponse(song);
	}

	@Get(':id/artist')
	async getSongArtist(
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Param('id', ParseIdPipe)
		songId: number
	) {
		let song = await this.songService.getSong({ byId: {  id: songId } });
		let artist = await this.artistService.getArtist({
			id: song.artistId
		}, include);
		return this.artistService.buildArtistResponse(artist);
	}

	@Get(':id/master')
	async getSongMaster(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIdPipe)
		songId: number
	) {
		let master = await this.trackService.getMasterTrack({
			byId: {  id: songId }
		}, include);
		return this.trackService.buildTrackResponse(master);
	}

	@Get(':id/tracks')
	async getSongTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIdPipe)
		songId: number
	) {
		let tracks = await this.trackService.getSongTracks({
			byId: {  id: songId }
		}, paginationParameters, include);
		if (tracks.length == 0)
			await this.songService.getSong({ byId: { id: songId }});
		return tracks.map((track) => this.trackService.buildTrackResponse(track));
	}

	@Get(':id/illustration')
	@Redirect()
	async getSongIllustration(
		@Param('id', ParseIdPipe)
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