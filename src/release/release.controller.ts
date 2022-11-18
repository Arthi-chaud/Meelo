import {
	Body, Controller, DefaultValuePipe, Get, Inject, ParseBoolPipe, Post, Put, Query, Req, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from './models/release.query-parameters';
import ReleaseService from './release.service';
import TrackService from 'src/track/track.service';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ParseReleaseIdentifierPipe from './release.pipe';
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import ReassignReleaseDTO from './models/reassign-release.dto';
import { ReleaseResponse } from './models/release.response';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { TrackResponse } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import { IdentifierParam } from 'src/identifier/identifier-param.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';

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
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@IdentifierParam(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = await this.releaseService.get(where, include);

		return this.releaseService.buildResponse(release);
	}

	@ApiOperation({
		summary: 'Get all tracks from a release'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/tracks')
	async getReleaseTracks(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const tracks = await this.trackService.getMany(
			{ byRelease: where }, paginationParameters, include, sortingParameter
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
		@IdentifierParam(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include?: TrackQueryParameters.RelationInclude
	) {
		const tracklist = await this.trackService.getTracklist(where, include);

		return this.trackService.buildTracklistResponse(tracklist);
	}

	@ApiOperation({
		summary: 'Get the playlist of a release'
	})
	@Get(':idOrSlug/playlist')
	async getReleasePlaylist(
		@IdentifierParam(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Query('random', new DefaultValuePipe(false), ParseBoolPipe)
		random: boolean,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include?: TrackQueryParameters.RelationInclude
	) {
		const tracklist = await this.trackService.getPlaylist(where, include, random);

		return Promise.all(tracklist.map((track) => this.trackService.buildResponse(track)));
	}

	@ApiOperation({
		summary: 'Get the parent album of a release'
	})
	@Get(':idOrSlug/album')
	async getReleaseAlbum(
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = this.releaseService.get(where);
		const album = await this.albumService.get({
			byId: { id: (await release).albumId }
		}, include);

		return this.albumService.buildResponse(album);
	}

	@ApiOperation({
		summary: 'Change the release\'s parent album'
	})
	@Post('reassign')
	async reassignRelease(
		@Body() reassignmentDTO: ReassignReleaseDTO
	) {
		return this.releaseService.buildResponse(
			await this.releaseService.reassign(
				{ byId: { id: reassignmentDTO.releaseId } },
				{ byId: { id: reassignmentDTO.albumId } }
			)
		);
	}

	@ApiOperation({
		summary: 'Set a release as master release'
	})
	@Put(':idOrSlug/master')
	async setAsMaster(
		@IdentifierParam(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = await this.releaseService.get(where);

		await this.releaseService.setReleaseAsMaster({
			releaseId: release.id,
			album: { byId: { id: release.albumId } }
		});
		const updatedReleases = await this.releaseService.getMasterRelease({ byId: { id: release.albumId } });

		return this.releaseService.buildResponse(updatedReleases);
	}
}
