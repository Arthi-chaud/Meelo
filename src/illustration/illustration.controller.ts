import { Controller, Get, Param, Response, Body, Post } from '@nestjs/common';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import { NoAlbumIllustrationException, NoReleaseIllustrationException } from './illustration.exceptions';
import IllustrationService from './illustration.service';
import type { IllustrationDownloadDto } from './models/illustration-dl.dto';

@Controller('illustrations')
export default class IllustrationController {

	constructor(
		private illustrationService: IllustrationService,
	) {}

	@Post(':artist')
	async updateArtistIllustration(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Body() illustrationDto: IllustrationDownloadDto) {
		const artistIllustrationPath = this.illustrationService.buildArtistIllustrationPath(artistSlug);
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			artistIllustrationPath
		);
	}


	@Get(':artist/:album')
	async getMasterIllustration(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
		@Response({ passthrough: true }) res: Response) {
		try {
			return this.streamFile(
				await this.illustrationService.buildMasterReleaseIllustrationPath(albumSlug, artistSlug),
				`${albumSlug}.jpg`,
				res
			);
		} catch {
			throw new NoAlbumIllustrationException(albumSlug);
		}
	}

	@Get(':artist/:album/:release')
	async getReleaseIllustration(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
		@Param('release', ParseSlugPipe) releaseSlug: Slug,
		@Response({ passthrough: true }) res: Response) {
		try {
			return this.streamFile(
				this.illustrationService.buildReleaseIllustrationPath(albumSlug, releaseSlug, artistSlug),
				`${releaseSlug}.jpg`,
				res
			);
		} catch {
			throw new NoReleaseIllustrationException(albumSlug, releaseSlug);
		}
	}


	@Post(':artist/:album/:release')
	async updateReleaseIllustration(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
		@Param('release', ParseSlugPipe) releaseSlug: Slug,
		@Body() illustrationDto: IllustrationDownloadDto) {
		const releasellustrationPath = this.illustrationService.buildReleaseIllustrationPath(
			albumSlug,
			releaseSlug,
			artistSlug
		);
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			releasellustrationPath
		);
	}

	
}
