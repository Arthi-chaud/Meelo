import { Controller, forwardRef, Get, Inject, Param } from '@nestjs/common';
import { MeeloException } from 'src/exceptions/meelo-exception';
import { IllustrationService } from 'src/illustration/illustration.service';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
import { ArtistService } from './artist.service';

@Controller('artists')
export class ArtistController {
	constructor(
		private artistService: ArtistService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
	) {}

	@Get()
	async getArtists() {
		let artists = await this.artistService.getArtists({ });
		return artists.map((artist) => ({
			...artist,
			illustration: this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug))
		}));
	}

	@Get('/:artist')
	async getArtist(@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined) {
		if (artistSlug == undefined)
			return {
				illustration: this.illustrationService.buildArtistIllustrationPath()
			};
		let artist = await this.artistService.getArtist({ slug: artistSlug })
		return {
			...artist,
			illustration: this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug))
		};
	}
}
