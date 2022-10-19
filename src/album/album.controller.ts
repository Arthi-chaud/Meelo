import { Body, Controller, forwardRef, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import ParseAlbumIdentifierPipe from './album.pipe';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';
import ReassignAlbumDTO from './models/reassign-album.dto';
import GenreService from "../genre/genre.service";
import { Genre } from "src/prisma/models";
import { AlbumResponse } from './models/album.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { ReleaseResponse } from 'src/release/models/release.response';
import { TrackResponse } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';

@ApiTags("Albums")
@Controller('albums')
export default class AlbumController {
	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private genreService: GenreService

	) {}

	@ApiOperation({
		summary: 'Get all albums'
	})
	@Get()
	@ApiPaginatedResponse(AlbumResponse)
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request,
	) {
		const albums = await this.albumService.getMany(
			{ byType: filter.type }, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			await Promise.all(albums.map((album) => this.albumService.buildResponse(album))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all compilations albums'
	})
	@ApiPaginatedResponse(AlbumResponse)
	@Get(`${compilationAlbumArtistKeyword}`)
	async getCompilationsAlbums(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{ byArtist: { compilationArtist: true }, byType: filter.type }, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			await Promise.all(albums.map((album) => this.albumService.buildResponse(album))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get one album'
	})
	@Get(':idOrSlug')
	async get(
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		const album = await this.albumService.get(where, include);
		return await this.albumService.buildResponse(album);
	}

	@ApiOperation({
		summary: 'Get the master release of an album'
	})
	@Get(':idOrSlug/master')
	async getAlbumMaster(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput
	) {
		const masterRelease = await this.releaseService.getMasterRelease(where, include);
		return await this.releaseService.buildResponse(masterRelease);
	}

	@ApiOperation({
		summary: 'Get all the releases of an album'
	})
	@ApiPaginatedResponse(ReleaseResponse)
	@Get(':idOrSlug/releases')
	async getAlbumReleases(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Query(ReleaseQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const releases = await this.releaseService.getAlbumReleases(
			where, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			await Promise.all(releases.map((release) => this.releaseService.buildResponse(release))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the genres of an album'
	})
	@Get(':idOrSlug/genres')
	async getAlbumGenres(
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
	): Promise<Genre[]> {
		const genres = await this.albumService.getGenres(where);
		return await Promise.all(genres.map((genre) => this.genreService.buildResponse(genre)));
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an album'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/videos')
	async getAlbumVideos(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ byAlbum: where, type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		if (videoTracks.length == 0)
			await this.albumService.throwIfNotFound(where);
		return new PaginatedResponse(
			await Promise.all(videoTracks.map(
				(videoTrack) => this.trackService.buildResponse(videoTrack)
			)),
			request
		);
	}

	@ApiOperation({
		summary: 'Change the album\'s parent artist'
	})
	@Post('reassign')
	async reassignAlbum(
		@Body() reassignmentDTO: ReassignAlbumDTO
	) {
		return await this.albumService.buildResponse(
			await this.albumService.reassign(
			{ byId: { id: reassignmentDTO.albumId } },
			reassignmentDTO.artistId == null
				? { compilationArtist: true }
				: { id: reassignmentDTO.artistId }
		));
	}


}