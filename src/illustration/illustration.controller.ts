import { Controller, Get, Param, ParseIntPipe, Res, StreamableFile, Response, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
import { NoAlbumIllustrationException, NoArtistIllustrationException, NoIllustrationException, NoReleaseIllustrationException } from './illustration.exceptions';
import { IllustrationService } from './illustration.service';

@Controller('illustrations')
export class IllustrationController {

	constructor(
		private illustrationService: IllustrationService,
		private fileManagerService: FileManagerService
	) {}

	@Get('/:artist')
	async getArtistIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
		@Response({ passthrough: true }) res: Response) {
		try {
			return this.streamFile(
				this.illustrationService.buildArtistIllustrationPath(artistSlug),
				`${artistSlug}.jpg`,
				res
			);
		} catch {
			throw new NoArtistIllustrationException(artistSlug);
		}
	}


	@Get('/:artist/:album')
	async getMasterIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
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

	@Get('/:artist/:album/:release')
	async getReleaseIllustration(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
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

	private streamFile(sourceFilePath: string, as: string, res: any): StreamableFile {
		if (this.fileManagerService.fileExists(sourceFilePath) == false)
			throw new NoIllustrationException("Illustration file not found");
		const illustration = fs.createReadStream(sourceFilePath);
		res.set({
			'Content-Disposition': `attachment; filename="${as}"`,
		});
		return new StreamableFile(illustration);
	}
}
