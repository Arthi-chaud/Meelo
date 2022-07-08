import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Artist } from '@prisma/client';
import { UrlGeneratorService } from 'nestjs-url-generator';
import IllustrationController from 'src/illustration/illustration.controller';
import type { PaginationParameters } from 'src/pagination/parameters';
import ParsePaginationParameterPipe from 'src/pagination/pipe';
import ParseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
import { ParseArtistSlugPipe } from 'src/slug/pipe';
import type Slug from 'src/slug/slug';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';

const ParseArtistRelationIncludePipe = new ParseRelationIncludePipe(ArtistQueryParameters.AvailableIncludes);

@Controller('artists')
export default class ArtistController {
	constructor(
		private artistService: ArtistService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	@Get()
	async getArtists(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseArtistRelationIncludePipe) include: ArtistQueryParameters.RelationInclude
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters, include);
		return artists.map((artist) => this.buildArtistResponse(artist));
	}

	@Get('/:artist')
	async getArtist(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Query('with', ParseArtistRelationIncludePipe) include: ArtistQueryParameters.RelationInclude
	) {
		let artist;
		if (artistSlug !== undefined)
		 	artist = await this.artistService.getArtist({ slug: artistSlug }, include);
		return this.buildArtistResponse(artist);
	}

	private buildArtistResponse(artist?: Artist) {
		return {
			...artist,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: IllustrationController,
				controllerMethod: IllustrationController.prototype.getArtistIllustration,
				params: {
					artist: artist?.slug ?? compilationAlbumArtistKeyword,
				}
			})
		}
	}
}
