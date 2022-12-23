import {
	Body, Controller, DefaultValuePipe, Get, Inject, Param,
	ParseBoolPipe, Post, Put, Query, Req, Res, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from './models/release.query-parameters';
import ReleaseService from './release.service';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import type { Request, Response } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import ReassignReleaseDTO from './models/reassign-release.dto';
import { ReleaseResponse } from './models/release.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { TrackResponse } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import { IdentifierParam } from 'src/identifier/models/identifier';

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
	@ApiPaginatedResponse(ReleaseResponse)
	async getReleases(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const releases = await this.releaseService.getMany(
			{}, paginationParameters, include, sortingParameter
		);

		return PaginatedResponse.awaiting(
			releases.map(
				(release) => this.releaseService.buildResponse(release)
			),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a release'
	})
	@Get(':idOrSlug')
	async getRelease(
		@Param() { idOrSlug }: IdentifierParam,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const release = await this.releaseService.get(where, include);

		return this.releaseService.buildResponse(release);
	}

	@ApiOperation({
		summary: 'Get all tracks from a release'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/tracks')
	async getReleaseTracks(
		@Param() { idOrSlug }: IdentifierParam,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const tracks = await this.trackService.getMany(
			{ release: where }, paginationParameters, include, sortingParameter
		);

		if (tracks.length == 0) {
			await this.releaseService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			tracks.map(
				(track) => this.trackService.buildResponse(track)
			),
			request
		);
	}

	@ApiOperation({
		summary: 'Get the tracklist of a release'
	})
	@Get(':idOrSlug/tracklist')
	async getReleaseTracklist(
		@Param() { idOrSlug }: IdentifierParam,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include?: TrackQueryParameters.RelationInclude
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const tracklist = await this.trackService.getTracklist(where, include);

		return this.trackService.buildTracklistResponse(tracklist);
	}

	@ApiOperation({
		summary: 'Get the playlist of a release'
	})
	@Get(':idOrSlug/playlist')
	async getReleasePlaylist(
		@Param() { idOrSlug }: IdentifierParam,
		@Query('random', new DefaultValuePipe(false), ParseBoolPipe)
		random: boolean,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include?: TrackQueryParameters.RelationInclude
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const tracklist = await this.trackService.getPlaylist(where, include, random);

		return Promise.all(tracklist.map((track) => this.trackService.buildResponse(track)));
	}

	@ApiOperation({
		summary: 'Download an archive of the release'
	})
	@Get(':idOrSlug/archive')
	async getReleaseArcive(
		@Param() { idOrSlug }: IdentifierParam,
		@Res() response: Response
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);

		return this.releaseService.pipeArchive(where, response);
	}

	@ApiOperation({
		summary: 'Get the parent album of a release'
	})
	@Get(':idOrSlug/album')
	async getReleaseAlbum(
		@Param() { idOrSlug }: IdentifierParam,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const release = this.releaseService.get(where);
		const album = await this.albumService.get({
			id: (await release).albumId
		}, include);

		return this.albumService.buildResponse(album);
	}

	@ApiOperation({
		summary: 'Change the release\'s parent album'
	})
	@Admin()
	@Post('reassign')
	async reassignRelease(
		@Body() reassignmentDTO: ReassignReleaseDTO
	) {
		return this.releaseService.buildResponse(
			await this.releaseService.reassign(
				{ id: reassignmentDTO.releaseId },
				{ id: reassignmentDTO.albumId }
			)
		);
	}

	@ApiOperation({
		summary: 'Set a release as master release'
	})
	@Admin()
	@Put(':idOrSlug/master')
	async setAsMaster(
		@Param() { idOrSlug }: IdentifierParam
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const release = await this.releaseService.get(where);

		await this.releaseService.setReleaseAsMaster({
			releaseId: release.id,
			album: { id: release.albumId }
		});
		const updatedReleases = await this.releaseService.getMasterRelease({
			id: release.albumId
		});

		return this.releaseService.buildResponse(updatedReleases);
	}
}
