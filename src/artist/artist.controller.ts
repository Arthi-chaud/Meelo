import { Controller, Get, Param } from '@nestjs/common';
import { IllustrationService } from 'src/illustration/illustration.service';
import { ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
import { ArtistService } from './artist.service';

@Controller('artists')
export class ArtistController {
	constructor(
		private artistService: ArtistService,
		private illustrationService: IllustrationService,
	) {}

	@Get('/:artist')
	async getArtist(@Param('artist', ParseSlugPipe) artistSlug: Slug) {
		let artist = await this.artistService.getArtist({ slug: artistSlug })
		return {
			...artist,
			illustration: this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug))
		};
	}
}
