import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { Artist } from '@prisma/client';
import { UrlGeneratorService } from 'nestjs-url-generator';
import IllustrationController from 'src/illustration/illustration.controller';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';

@Controller('artists')
export default class ArtistController {
	constructor(
		private artistService: ArtistService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	@Get()
	async getArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters, include);
		return artists.map((artist) => this.buildArtistResponse(artist));
	}

	@Get()
	async getAlbumArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters, include);
		return artists.map((artist) => this.buildArtistResponse(artist));
	}

	@Get('/:id')
	async getArtist(
		@Param('id', ParseIntPipe)
		artistId: number,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artist = await this.artistService.getArtist({ id: artistId }, include);
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
