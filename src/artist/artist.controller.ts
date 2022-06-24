import { Controller, Get, Param } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
import { ArtistService } from './artist.service';

@Controller('artists')
export class ArtistController {
	constructor(private artistService: ArtistService) {}

	@Get('/:artist')
	async getArtist(@Param('artist', ParseSlugPipe) artistSlug: Slug) {
		return await this.artistService.getArtist(
			{ bySlug: { slug: artistSlug } },
		);
	}
}
