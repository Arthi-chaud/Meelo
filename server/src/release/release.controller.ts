import {
	Body, Controller, DefaultValuePipe, Get, Inject,
	ParseBoolPipe, Post, Put, Query, Res, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from './models/release.query-parameters';
import ReleaseService from './release.service';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import type { Response as ExpressResponse } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import ReassignReleaseDTO from './models/reassign-release.dto';
import { TrackResponseBuilder } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';
import { ReleaseResponseBuilder } from './models/release.response';
import { TracklistResponseBuilder } from 'src/track/models/tracklist.model';
import { AlbumResponseBuilder } from 'src/album/models/album.response';

@ApiTags("Releases")
@Controller('releases')
export default class ReleaseController {
	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService
	) { }

	@ApiOperation({
		summary: 'Get all releases'
	})
	@Get()
	@Response({
		handler: ReleaseResponseBuilder,
		type: ResponseType.Page
	})
	async getReleases(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter
	) {
		return this.releaseService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get a release'
	})
	@Response({ handler: ReleaseResponseBuilder })
	@Get(':idOrSlug')
	async getRelease(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
	) {
		return this.releaseService.get(where, include);
	}

	@ApiOperation({
		summary: 'Get all tracks from a release'
	})
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/tracks')
	async getReleaseTracks(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput
	) {
		const tracks = await this.trackService.getMany(
			{ release: where }, paginationParameters, include, sortingParameter
		);

		if (tracks.length == 0) {
			await this.releaseService.throwIfNotFound(where);
		}
		return tracks;
	}

	@ApiOperation({
		summary: 'Get the tracklist of a release'
	})
	@Response({ handler: TracklistResponseBuilder })
	@Get(':idOrSlug/tracklist')
	async getReleaseTracklist(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		return this.trackService.getTracklist(where, include);
	}

	@ApiOperation({
		summary: 'Get the playlist of a release'
	})
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Array
	})
	@Get(':idOrSlug/playlist')
	async getReleasePlaylist(
		@Query('random', new DefaultValuePipe(false), ParseBoolPipe)
		random: boolean,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		return this.trackService.getPlaylist(where, include, random);
	}

	@ApiOperation({
		summary: 'Download an archive of the release'
	})
	@Get(':idOrSlug/archive')
	async getReleaseArcive(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Res() response: ExpressResponse
	) {
		return this.releaseService.pipeArchive(where, response);
	}

	@ApiOperation({
		summary: 'Get the parent album of a release'
	})
	@Get(':idOrSlug/album')
	@Response({ handler: AlbumResponseBuilder })
	async getReleaseAlbum(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
	) {
		const release = this.releaseService.get(where);

		return this.albumService.get({
			id: (await release).albumId
		}, include);
	}

	@ApiOperation({
		summary: 'Change the release\'s parent album'
	})
	@Admin()
	@Response({ handler: ReleaseResponseBuilder })
	@Post('reassign')
	async reassignRelease(
		@Body() reassignmentDTO: ReassignReleaseDTO
	) {
		return this.releaseService.reassign(
			{ id: reassignmentDTO.releaseId },
			{ id: reassignmentDTO.albumId }
		);
	}

	@ApiOperation({
		summary: 'Set a release as master release'
	})
	@Admin()
	@Response({ handler: ReleaseResponseBuilder })
	@Put(':idOrSlug/master')
	async setAsMaster(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		const release = await this.releaseService.get(where);

		await this.releaseService.setReleaseAsMaster({
			releaseId: release.id,
			album: { id: release.albumId }
		});
		return this.releaseService.getMasterRelease({
			id: release.albumId
		});
	}
}
