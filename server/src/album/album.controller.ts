import {
	Body, Controller, Get, Inject, Post, Query, Req, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import ReassignAlbumDTO from './models/reassign-album.dto';
import GenreService from "../genre/genre.service";
import { Genre } from "src/prisma/models";
import { AlbumResponse, AlbumResponseBuilder } from './models/album.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { ReleaseResponse } from 'src/release/models/release.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import { TrackResponse } from 'src/track/models/track.response';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';

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

	@Get()
	@Response({
		handler: new AlbumResponseBuilder(),
		type: ResponseType.PAGE
	})
	@ApiOperation({ summary: 'Get all albums' })
	@ApiPaginatedResponse(AlbumResponse)
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
	) {
		return this.albumService.getMany(
			{ type: filter.type }, paginationParameters, include, sortingParameter
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
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{ artist: { compilationArtist: true }, type: filter.type },
			paginationParameters,
			include,
			sortingParameter
		);

		return PaginatedResponse.awaiting(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get one album'
	})
	@Get(':idOrSlug')
	async get(
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		const album = await this.albumService.get(
			where,
			include
		);

		return this.albumService.buildResponse(album);
	}

	@ApiOperation({
		summary: 'Get the master release of an album'
	})
	@Get(':idOrSlug/master')
	async getAlbumMaster(
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		const masterRelease = await this.releaseService.getMasterRelease(
			where,
			include
		);

		return this.releaseService.buildResponse(masterRelease);
	}

	@ApiOperation({
		summary: 'Get all the releases of an album'
	})
	@ApiPaginatedResponse(ReleaseResponse)
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
		@Req() request: Request
	) {
		const releases = await this.releaseService.getAlbumReleases(
			where,
			paginationParameters,
			include,
			sortingParameter
		);

		return PaginatedResponse.awaiting(
			releases.map((release) => this.releaseService.buildResponse(release)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the genres of an album'
	})
	@Get(':idOrSlug/genres')
	async getAlbumGenres(
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	): Promise<Genre[]> {
		const genres = await this.albumService.getGenres(where);

		return Promise.all(genres.map((genre) => this.genreService.buildResponse(genre)));
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an album',
		description: "Return all video tracks of songs in album, so it might include tracks that are not in the album's tracklist"
	})
	@Get(':idOrSlug/videos')
	async getAlbumVideos(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	): Promise<TrackResponse[]> {
		const albumReleases = await this.releaseService.getAlbumReleases(
			where,
			{ },
			{ tracks: true }
		);

		return Promise.all(
			albumReleases
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
				}, { take: 1 }, include))
		).then((tracks) => Promise.all(
			tracks
				.flat()
				.map((track) => this.trackService.buildResponse(track))
		));
	}

	@ApiOperation({
		summary: 'Change the album\'s parent artist'
	})
	@Admin()
	@Post('reassign')
	async reassignAlbum(
		@Body() reassignmentDTO: ReassignAlbumDTO
	) {
		return this.albumService.buildResponse(
			await this.albumService.reassign(
				{ id: reassignmentDTO.albumId },
				reassignmentDTO.artistId == null
					? { compilationArtist: true }
					: { id: reassignmentDTO.artistId }
			)
		);
	}
}
