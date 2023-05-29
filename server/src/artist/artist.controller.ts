import {
	Controller, Get, Inject, Query, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from '@nestjs/swagger';
import { ArtistResponseBuilder } from './models/artist.response';
import { SongResponseBuilder } from 'src/song/models/song.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Response, { ResponseType } from 'src/response/response.decorator';
import { SongWithVideoResponseBuilder } from 'src/song/models/song-with-video.response';
import { IsOptional } from 'class-validator';
import TransformIdentifier from 'src/identifier/identifier.transform';
import GenreService from 'src/genre/genre.service';
import LibraryService from 'src/library/library.service';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';

class Selector extends IntersectionType(ArtistQueryParameters.SortingParameter) {
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Search artists using a string token'
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'If true, only artists that have at least one album will be returned'
	})
	albumArtistOnly?: boolean;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter artists by genre'
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter artists by library'
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;
}

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
		summary: 'Get many artists'
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query() selector: Selector,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.artistService.search(
				selector.query,
				selector,
				paginationParameters,
				include,
				selector
			);
		}
		return this.artistService.getMany(
			selector,
			paginationParameters,
			include,
			selector
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
