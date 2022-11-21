import {
	Controller, DefaultValuePipe, Get, Inject, ParseBoolPipe, Query, Req, forwardRef
} from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ParseArtistIdentifierPipe from './artist.pipe';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import type { Request } from 'express';
import {
	ApiOperation, ApiQuery, ApiTags
} from '@nestjs/swagger';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import { TrackType } from '@prisma/client';
import { Artist } from 'src/prisma/models';
import { ArtistResponse } from './models/artist.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { TrackResponse } from 'src/track/models/track.response';
import { AlbumResponse } from 'src/album/models/album.response';
import { SongResponse } from 'src/song/models/song.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import { IdentifierParam } from 'src/identifier/identifier-param.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';

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
		private trackService: TrackService
	) {}

	@ApiOperation({
		summary: 'Get all artists'
	})
	@ApiQuery({
		name: 'albumArtistOnly',
		required: false
	})
	@ApiPaginatedResponse(ArtistResponse)
	@Get()
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request,
		@Query('albumArtistOnly', new DefaultValuePipe(false), ParseBoolPipe)
		albumArtistsOnly = false,
	) {
		let artists: Artist[] = [];

		if (albumArtistsOnly) {
			artists = await this.artistService.getAlbumsArtists(
				{}, paginationParameters, include, sortingParameter
			);
		} else {
			artists = await this.artistService.getMany(
				{}, paginationParameters, include, sortingParameter
			);
		}
		return PaginatedResponse.awaiting(
			artists.map((artist) => this.artistService.buildResponse(artist)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get one artist'
	})
	@Get(':idOrSlug')
	async get(
		@IdentifierParam(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude
	) {
		const artist = await this.artistService.get(where, include);

		return this.artistService.buildResponse(artist);
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an artist'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/videos')
	async getArtistVideos(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@IdentifierParam(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ byArtist: where, type: TrackType.Video },
			paginationParameters,
			include,
			sortingParameter
		);

		if (videoTracks.length == 0) {
			await this.artistService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			videoTracks.map(
				(videoTrack) => this.trackService.buildResponse(videoTrack)
			),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums from an artist'
	})
	@Get(':idOrSlug/albums')
	@ApiPaginatedResponse(AlbumResponse)
	async getArtistAlbums(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@IdentifierParam(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{ byArtist: where, byType: filter.type },
			paginationParameters,
			include,
			sortingParameter
		);

		if (albums.length == 0) {
			await this.artistService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all songs from an artist',
	})
	@ApiPaginatedResponse(SongResponse)
	@Get(':idOrSlug/songs')
	async getArtistSongs(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@IdentifierParam(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		const songs = await this.songService.getMany(
			{ artist: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.artistService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			songs.map((song) => this.songService.buildResponse(song)),
			request
		);
	}
}
