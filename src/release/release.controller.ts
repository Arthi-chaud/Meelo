import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import ParseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from './models/release.query-parameters';
import ReleaseService from './release.service';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import type Slug from 'src/slug/slug';

const ParseReleaseRelationIncludePipe = new ParseRelationIncludePipe(ReleaseQueryParameters.AvailableIncludes);


@Controller('releases')
export default class ReleaseController {
	constructor(private releaseService: ReleaseService) { }
	
	@Get()
	async getReleases(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseReleaseRelationIncludePipe) include: ReleaseQueryParameters.RelationInclude
	) {
		return await this.releaseService.getReleases({}, paginationParameters, include);
	}

	@Get('/:id')
	async getReleaseById(
		@Query('with', ParseReleaseRelationIncludePipe) include: ReleaseQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe) releaseId: number
	) {
		return await this.releaseService.getRelease({ byId: { id: releaseId } }, include);
	}

	@Get('/:artist/:album/:release')
	async getReleaseBySlug(
		@Query('with', ParseReleaseRelationIncludePipe) include: ReleaseQueryParameters.RelationInclude,
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
		@Param('release', ParseSlugPipe) releaseSlug: Slug,
	) {
		return await this.releaseService.getRelease({
			bySlug: {
				slug: releaseSlug,
				album: {
					bySlug: {
						slug: albumSlug,
						artist: artistSlug ? {
							slug: artistSlug
						} : undefined
					}
				}
			}
		}, include);
	}

	@Get('/:artist/:album/')
	async getReleaseByAlbum(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseReleaseRelationIncludePipe) include: ReleaseQueryParameters.RelationInclude,
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
	) {
		return await this.releaseService.getReleases({ 
			album: {
				bySlug: {
					slug: albumSlug,
					artist: artistSlug ? { slug: artistSlug } : undefined
				}
			}
		}, paginationParameters, include);
	}
}