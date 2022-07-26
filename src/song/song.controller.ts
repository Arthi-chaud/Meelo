import { Controller, forwardRef, Get, Inject, Param, Query, Redirect, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UrlGeneratorService } from 'nestjs-url-generator';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import { TrackController } from 'src/track/track.controller';
import TrackService from 'src/track/track.service';
import SongQueryParameters from './models/song.query-params';
import ParseSongIdentifierPipe from './song.pipe';
import SongService from './song.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';

@ApiTags("Songs")
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

	@ApiOperation({
		summary: 'Get all songs'
	})
	@Get()
	async getSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		let songs = await this.songService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			songs.map((song) => this.songService.buildResponse(song)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a song'
	})
	@Get(':idOrSlug')
	async getSong(
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let song = await this.songService.get(where, include);
		return this.songService.buildResponse(song);
	}

	@ApiOperation({
		summary: 'Get a song\'s artist'
	})
	@Get(':idOrSlug/artist')
	async getSongArtist(
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let song = await this.songService.get(where);
		let artist = await this.artistService.get({
			id: song.artistId
		}, include);
		return this.artistService.buildResponse(artist);
	}

	@ApiOperation({
		summary: 'Get a song\'s master track'
	})
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

	@ApiOperation({
		summary: 'Get all the song\'s tracks'
	})
	@Get(':idOrSlug/tracks')
	async getSongTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		let tracks = await this.trackService.getSongTracks(
			where, paginationParameters, include, sortingParameter
		);
		if (tracks.length == 0)
			await this.songService.get(where);
		return new PaginatedResponse(
			tracks.map((track) => this.trackService.buildTrackResponse(track)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the song\'s video tracks'
	})
	@Get(':idOrSlug/videos')
	async getSongVideos(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getTracks(
			{ bySong: where, type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		if (videoTracks.length == 0)
			await this.songService.get(where);
		return new PaginatedResponse(
			videoTracks.map((videoTrack) => this.trackService.buildTrackResponse(videoTrack)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a song\'s illustration'
	})
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