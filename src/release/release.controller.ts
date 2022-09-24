import { Body, Controller, DefaultValuePipe, forwardRef, Get, Inject, Param, ParseBoolPipe, Post, Query, Req } from '@nestjs/common';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
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
import type ReassignReleaseDTO from './models/reassign-release.dto';

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
	async getReleases(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Query(ReleaseQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const releases = await this.releaseService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			await Promise.all(releases.map(
				(release) => this.releaseService.buildResponse(release)
			)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a release'
	})
	@Get(':idOrSlug')
	async getRelease(
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = await this.releaseService.get(where, include);
		return await this.releaseService.buildResponse(release);
	}

	@ApiOperation({
		summary: 'Get all tracks from a release'
	})
	@Get(':idOrSlug/tracks')
	async getReleaseTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const tracks = await this.trackService.getMany(
			{ byRelease: where }, paginationParameters, include, sortingParameter
		);
		if (tracks.length == 0)
			await this.releaseService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(tracks.map(
				(track) => this.trackService.buildResponse(track)
			)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get the tracklist of a release'
	})
	@Get(':idOrSlug/tracklist')
	async getReleaseTracklist(
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include?: TrackQueryParameters.RelationInclude
	) {
		const tracklist = await this.trackService.getTracklist(where, include);
		return await this.trackService.buildTracklistResponse(tracklist);
	}

	@ApiOperation({
		summary: 'Get the playlist of a release'
	})
	@Get(':idOrSlug/playlist')
	async getReleasePlaylist(
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Query('random', new DefaultValuePipe(false), ParseBoolPipe)
		random: boolean,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include?: TrackQueryParameters.RelationInclude
	) {
		const tracklist = await this.trackService.getPlaylist(where, include, random);
		return await Promise.all(tracklist.map((track) => this.trackService.buildResponse(track)));
	}

	@ApiOperation({
		summary: 'Get the parent album of a release'
	})
	@Get(':idOrSlug/album')
	async getReleaseAlbum(
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput
	) {
		const release = this.releaseService.get(where);
		const album = await this.albumService.get({
			byId: { id: (await release).albumId }
		}, include);
		return await this.albumService.buildResponse(album);

	}

	@ApiOperation({
		summary: 'Change the release\'s parent album'
	})
	@Post('reassign')
	async reassignTrack(
		@Body() reassignmentDTO: ReassignReleaseDTO
	) {
		return await this.releaseService.buildResponse(
			await this.releaseService.reassign(
			{ byId: { id: reassignmentDTO.releaseId }},
			{ byId: { id: reassignmentDTO.albumId }}
		));
	}
}