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
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from '@nestjs/swagger';
import ReassignReleaseDTO from './models/reassign-release.dto';
import { TrackResponseBuilder } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import Admin from 'src/roles/admin.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';
import { ReleaseResponseBuilder } from './models/release.response';
import { TracklistResponseBuilder } from 'src/track/models/tracklist.model';
import { AlbumResponseBuilder } from 'src/album/models/album.response';
import { IsOptional } from 'class-validator';
import TransformIdentifier from 'src/identifier/identifier.transform';
import LibraryService from 'src/library/library.service';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';

class Selector extends IntersectionType(ReleaseQueryParameters.SortingParameter) {
	@IsOptional()
	@ApiPropertyOptional({
		description: `Filter releases by albums`
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Filter releases by library`
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;
}

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
		summary: 'Get many releases'
	})
	@Get()
	@Response({
		handler: ReleaseResponseBuilder,
		type: ResponseType.Page
	})
	async getReleases(
		@Query() selector: Selector,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude
	) {
		return this.releaseService.getMany(
			selector, paginationParameters, include, selector
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

		await this.albumService.setMasterRelease(where);
		return release;
	}
}
