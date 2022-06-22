import { Controller, Get, Param, ParseIntPipe, Res, StreamableFile, Response, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
import { NoIllustrationException } from './illustration.exceptions';
import { IllustrationService } from './illustration.service';

@Controller('illustrations')
export class IllustrationController {

	constructor(private illustrationService: IllustrationService) {}

	@Get('/:artist')
	async getArtistIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
		@Response({ passthrough: true }) res: Response) {
		return this.streamFile(
			this.illustrationService.buildArtistIllustrationPath(artistSlug),
			`${artistSlug}.jpg`,
			res
		);
	}


	@Get('/:artist/:album')
	async getMasterIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
		@Response({ passthrough: true }) res: Response) {
		return this.streamFile(
			await this.illustrationService.buildMasterReleaseIllustrationPath(artistSlug, albumSlug),
			`${albumSlug}.jpg`,
			res
		);
	}

	@Get('/:artist/:album/:release')
	async getReleaseIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
		@Param('album', ParseSlugPipe) albumSlug: Slug,
		@Param('release', ParseSlugPipe) releaseSlug: Slug,
		@Response({ passthrough: true }) res: Response) {
		return this.streamFile(
			this.illustrationService.buildReleaseIllustrationPath(artistSlug, albumSlug, releaseSlug),
			`${releaseSlug}.jpg`,
			res
		);

	}

	private streamFile(sourceFilePath: string, as: string, res: any): StreamableFile {
		try {
			const illustration = fs.createReadStream(sourceFilePath);
			res.set({
				'Content-Disposition': `attachment; filename="${as}"`,
			});
			return new StreamableFile(illustration);
		} catch {
			throw new NoIllustrationException("No illustration file found");
		}
	}
}
