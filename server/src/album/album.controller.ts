import {
	Body, Controller, Get, Inject, Post, Query, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from '@nestjs/swagger';
import ReassignAlbumDTO from './models/reassign-album.dto';
import { AlbumResponseBuilder } from './models/album.response';
import { ReleaseResponseBuilder } from 'src/release/models/release.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import { TrackResponseBuilder } from 'src/track/models/track.response';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';
import GenreService from 'src/genre/genre.service';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import { IsEnum, IsOptional } from 'class-validator';
import { AlbumType } from '@prisma/client';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import TransformIdentifier from 'src/identifier/identifier.transform';
import ArtistService from 'src/artist/artist.service';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';
import LibraryService from 'src/library/library.service';

class Selector extends IntersectionType(
	AlbumQueryParameters.SortingParameter
) {
	@IsEnum(AlbumType, {
		message: () => `Album Type: Invalid value. Expected one of theses: ${Object.keys(AlbumType)}`
	})
	@IsOptional()
	@ApiPropertyOptional({
		enum: AlbumType,
		description: 'Filter the albums by type'
	})
	type?: AlbumType;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Filter albums by (album) artist, using their identifier.<br/>
		For compilation albums, use '${compilationAlbumArtistKeyword}'`
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter albums by genre'
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Search albums using a string token'
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter albums by library'
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;
}

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
	) {}

	@Get()
	@Response({
		handler: AlbumResponseBuilder,
		type: ResponseType.Page
	})
	@ApiOperation({ summary: 'Get many albums' })
	async getMany(
		@Query() selector: Selector,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.albumService.search(
				selector.query,
				selector,
				paginationParameters,
				include,
				selector
			);
		}
		return this.albumService.getMany(
			selector,
			paginationParameters,
			include,
			selector
		);
	}

	@ApiOperation({
		summary: 'Get one album'
	})
	@Get(':idOrSlug')
	@Response({ handler: AlbumResponseBuilder })
	async get(
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.albumService.get(
			where,
			include
		);
	}

	@ApiOperation({
		summary: 'Get the master release of an album'
	})
	@Response({ handler: ReleaseResponseBuilder })
	@Get(':idOrSlug/master')
	async getAlbumMaster(
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.releaseService.getMasterRelease(
			where,
			include
		);
	}

	@ApiOperation({
		summary: 'Get all the releases of an album'
	})
	@Response({
		handler: ReleaseResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/releases')
	async getAlbumReleases(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.releaseService.getAlbumReleases(
			where,
			paginationParameters,
			include,
			sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an album',
		description: "Return all video tracks of songs in album, so it might include tracks that are not in the album's tracklist"
	})
	@Get(':idOrSlug/videos')
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Array
	})
	async getAlbumVideos(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		const albumReleases = await this.releaseService.getAlbumReleases(
			where,
			{ },
			{ tracks: true }
		);

		return Promise.all(albumReleases
			.map((release) => release.tracks)
			.flat()
			.filter((track, index, array) => index == array.indexOf(track))
			.sort((track1, track2) => {
				if (track1.discIndex != track2.discIndex) {
					return (track1.discIndex ?? 0) - (track2.discIndex ?? 0);
				}
				return (track1.trackIndex ?? 0) - (track2.trackIndex ?? 0);
			})
			.filter((track, index, array) => array.findIndex(
				(otherTrack) => otherTrack.songId == track.songId
			) == index)
			.map((track) => this.trackService.getMany({
				type: 'Video',
				song: { id: track.songId },
			}, { take: 1 }, include))).then((tracks) => tracks.flat());
	}

	@ApiOperation({
		summary: 'Change the album\'s parent artist'
	})
	@Admin()
	@Response({ handler: AlbumResponseBuilder })
	@Post('reassign')
	async reassignAlbum(
		@Body() reassignmentDTO: ReassignAlbumDTO
	) {
		return this.albumService.reassign(
			{ id: reassignmentDTO.albumId },
			reassignmentDTO.artistId == null
				? { compilationArtist: true }
				: { id: reassignmentDTO.artistId }
		);
	}
}
