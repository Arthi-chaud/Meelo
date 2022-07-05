import { Controller, forwardRef, Get, Inject, Param, Query } from '@nestjs/common';
import type { Artist } from '@prisma/client';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationPath } from 'src/illustration/models/illustration-path.model';
import type { PaginationParameters } from 'src/pagination/parameters';
import ParsePaginationParameterPipe from 'src/pagination/pipe';
import { ParseArtistSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import ArtistService from './artist.service';

@Controller('artists')
export default class ArtistController {
	constructor(
		private artistService: ArtistService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
	) {}

	@Get()
	async getArtists(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters);
		return artists.map((artist) => this.buildArtistResponse(artist));
	}

	@Get('/:artist')
	async getArtist(@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined) {
		let artist;
		if (artistSlug !== undefined)
		 	artist = await this.artistService.getArtist({ slug: artistSlug });
		return this.buildArtistResponse(artist);
	}

	private buildArtistResponse(artist?: Artist) {
		let illustrationPath: IllustrationPath | null = this.illustrationService.buildArtistIllustrationFolderPath(
			artist ? new Slug(artist.slug) : undefined
		);
		if (this.illustrationService.illustrationExists(illustrationPath) == false)
			illustrationPath = null;
		return {
			...artist,
			illustration: illustrationPath
		}
	}
}
