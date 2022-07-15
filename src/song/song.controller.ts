import { Controller, forwardRef, Get, Inject, Param, Query, Redirect } from '@nestjs/common';
import { UrlGeneratorService } from 'nestjs-url-generator';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import { TrackController } from 'src/track/track.controller';
import TrackService from 'src/track/track.service';
import SongQueryParameters from './models/song.query-params';
import ParseSongIdentifierPipe from './song.pipe';
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

	@Get(':idOrSlug')
	async getSong(
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let song = await this.songService.getSong(where, include);
		return this.songService.buildSongResponse(song);
	}

	@Get(':idOrSlug/artist')
	async getSongArtist(
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let song = await this.songService.getSong(where);
		let artist = await this.artistService.getArtist({
			id: song.artistId
		}, include);
		return this.artistService.buildArtistResponse(artist);
	}

	@Get(':idOrSlug/master')
	async getSongMaster(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let master = await this.trackService.getMasterTrack(where, include);
		return this.trackService.buildTrackResponse(master);
	}

	@Get(':idOrSlug/tracks')
	async getSongTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let tracks = await this.trackService.getSongTracks(where, paginationParameters, include);
		if (tracks.length == 0)
			await this.songService.getSong(where);
		return tracks.map((track) => this.trackService.buildTrackResponse(track));
	}

	@Get(':idOrSlug/illustration')
	@Redirect()
	async getSongIllustration(
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let master = await this.trackService.getMasterTrack(where);
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