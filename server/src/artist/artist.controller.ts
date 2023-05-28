import {
	Controller, DefaultValuePipe, Get, Inject, ParseBoolPipe, Query, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import {
	ApiOperation, ApiQuery, ApiTags
} from '@nestjs/swagger';
import { ArtistResponseBuilder } from './models/artist.response';
import { SongResponseBuilder } from 'src/song/models/song.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Response, { ResponseType } from 'src/response/response.decorator';
import { SongWithVideoResponseBuilder } from 'src/song/models/song-with-video.response';

@ApiTags("Artists")
@Controller('artists')
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService
	) {}

	@ApiOperation({
		summary: 'Get all artists'
	})
	@ApiQuery({
		name: 'albumArtistOnly',
		required: false
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Query('albumArtistOnly', new DefaultValuePipe(false), ParseBoolPipe)
		albumArtistsOnly = false,
	) {
		if (albumArtistsOnly) {
			return this.artistService.getAlbumsArtists(
				{}, paginationParameters, include, sortingParameter
			);
		}
		return this.artistService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get one artist'
	})
	@Response({
		handler: ArtistResponseBuilder
	})
	@Get(':idOrSlug')
	async get(
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
	) {
		return this.artistService.get(where, include);
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an artist'
	})
	@Response({
		handler: SongWithVideoResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/videos')
	async getArtistVideos(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput
	) {
		const videoTracks = await this.songService.getSongsWithVideo(
			{ artist: where },
			paginationParameters,
			include,
			sortingParameter
		);

		if (videoTracks.length == 0) {
			await this.artistService.throwIfNotFound(where);
		}
		return videoTracks;
	}

	@ApiOperation({
		summary: 'Get all songs from an artist',
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/songs')
	async getArtistSongs(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput
	) {
		const songs = await this.songService.getMany(
			{ artist: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.artistService.throwIfNotFound(where);
		}
		return songs;
	}
}
