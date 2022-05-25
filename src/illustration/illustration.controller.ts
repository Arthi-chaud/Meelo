import { Controller, Get, Param, ParseIntPipe, Res, StreamableFile, Response, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { ParseSlugPipe } from 'src/slug/pipe';
import { IllustrationService } from './illustration.service';

@Controller('illustrations')
export class IllustrationController {

	constructor(private illustrationService: IllustrationService) {}

	@Get('/:artist')
	async getArtistIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: string,
		@Response({ passthrough: true }) res: Response) {
			try {
				const illustration = fs.createReadStream(this.illustrationService.getArtistIllustrationPath(artistSlug));
				this.setAttachmentFileName(res, `${artistSlug}.jpg`)
				return new StreamableFile(illustration);
			} catch (e) {
				throw new HttpException(e.message, HttpStatus.NOT_FOUND);
			}
	}


	@Get('/:artist/:album')
	async getMasterIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: string,
		@Param('album', ParseSlugPipe) albumSlug: string) {

	}

	@Get('/:artist/:album/:release')
	async getReleaseIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: string,
		@Param('album', ParseSlugPipe) albumSlug: string,
		@Param('release', ParseIntPipe) releaseId: number) {

	}

	private setAttachmentFileName(res, output: string) {
		res.set({
			'Content-Disposition': `attachment; filename="${output}"`,
		});
	}
}
