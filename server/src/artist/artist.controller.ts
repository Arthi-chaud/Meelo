import {
	Controller, DefaultValuePipe, Get, Inject, ParseBoolPipe, Query, forwardRef
} from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import {
	ApiOperation, ApiQuery, ApiTags
} from '@nestjs/swagger';
import { ArtistResponseBuilder } from './models/artist.response';
import { AlbumResponseBuilder } from 'src/album/models/album.response';
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
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
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
		summary: 'Get all albums from an artist'
	})
	@Response({
		handler: AlbumResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/albums')
	async getArtistAlbums(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput
	) {
		const albums = await this.albumService.getMany(
			{ artist: where, type: filter.type },
			paginationParameters,
			include,
			sortingParameter
		);

		if (albums.length == 0) {
			await this.artistService.throwIfNotFound(where);
		}
		return albums;
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
