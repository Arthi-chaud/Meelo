import { Body, Controller, DefaultValuePipe, forwardRef, Get, Inject, Param, ParseBoolPipe, Post, Query, Req, Response } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationDownloadDto } from 'src/illustration/models/illustration-dl.dto';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import Slug from 'src/slug/slug';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ParseArtistIdentifierPipe from './artist.pipe';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import type { Request } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import { Artist, TrackType } from '@prisma/client';

@ApiTags("Artists")
@Controller('artists')
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private illustrationService: IllustrationService
	) {}

	@ApiOperation({
		summary: 'Get all artists'
	})
	@ApiQuery({
		name: 'albumArtistOnly',
		required: false
	})
	@Get()
	async getMany(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Query(ArtistQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Query('albumArtistOnly', new DefaultValuePipe(false), ParseBoolPipe)
		albumArtistsOnly: boolean = false,
		@Req() request: Request
	) {
		let artists: Artist[];
		if (albumArtistsOnly) {
			artists = await this.artistService.getAlbumsArtists(
				{}, paginationParameters, include, sortingParameter
			);
		} else {
			artists = await this.artistService.getMany(
				{}, paginationParameters, include, sortingParameter
			);
		}
		return new PaginatedResponse(
			artists.map((artist) => this.artistService.buildResponse(artist)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get one artist'
	})
	@Get(':idOrSlug')
	async get(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artist = await this.artistService.get(where, include);
		return this.artistService.buildResponse(artist);
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an artist'
	})
	@Get(':idOrSlug/videos')
	async getArtistVideos(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ byArtist: where, type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		if (videoTracks.length == 0)
			await this.artistService.get(where);
		return new PaginatedResponse(
			videoTracks.map((videoTrack) => this.trackService.buildResponse(videoTrack)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get an artist\'s illustration'
	})
	@Get(':idOrSlug/illustration')
	async getArtistIllustration(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response
	) {
		let artist = await this.artistService.get(where);
		return this.illustrationService.streamIllustration(
			this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug)),
			artist.slug, res
		);
	}

	@ApiOperation({
		summary: 'Change an artist\'s illustration'
	})
	@Post(':idOrSlug/illustration')
	async updateArtistIllustration(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let artist = await this.artistService.get(where);
		const artistIllustrationPath = this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug));
		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			artistIllustrationPath
		);
	}

	@ApiOperation({
		summary: 'Get all albums from an artist'
	})
	@Get(':idOrSlug/albums')
	async getArtistAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		let albums = await this.albumService.getMany(
			{ byArtist: where }, paginationParameters, include, sortingParameter
		);
		if (albums.length == 0)
			await this.artistService.get(where);
		return new PaginatedResponse(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all songs from an artist',
	})
	@Get(':idOrSlug/songs')
	async getArtistSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		let songs = await this.songService.getMany(
			{ artist: where }, paginationParameters, include, sortingParameter
		);
		if (songs.length == 0)
			await this.artistService.get(where);
		return new PaginatedResponse(
			songs.map((song) => this.songService.buildResponse(song)),
			request
		);
	}
}
