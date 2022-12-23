import {
	Body, Controller, Delete, Get, Param, Post, Query, Response
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import ArtistService from "src/artist/artist.service";
import ReleaseService from "src/release/release.service";
import Slug from "src/slug/slug";
import TrackService from "src/track/track.service";
import { NoReleaseIllustrationException } from "./illustration.exceptions";
import IllustrationService from "./illustration.service";
import { IllustrationDownloadDto } from "./models/illustration-dl.dto";
import { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";
import Admin from "src/roles/admin.decorator";
import { IdentifierParam } from "src/identifier/models/identifier";
import AlbumService from "src/album/album.service";
import SongService from "src/song/song.service";

@ApiTags("Illustrations")
@Controller('illustrations')
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private releaseService: ReleaseService,
		private trackService: TrackService,
		private artistService: ArtistService
	) {}

	@ApiOperation({
		summary: "Get an artist's illustration"
	})
	@Get('artists/:idOrSlug')
	async getArtistIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const where = ArtistService.formatIdentifierToWhereInput(idOrSlug);
		const artist = await this.artistService.select(where, { slug: true });
		const artistIllustration = await this.artistService.buildIllustrationPath(where);

		return this.illustrationService.streamIllustration(
			artistIllustration,
			artist.slug,
			dimensions,
			res
		);
	}

	@ApiOperation({
		summary: 'Change an artist\'s illustration'
	})
	@Admin()
	@Post('artists/:idOrSlug')
	async updateArtistIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Body() illustrationDto: IllustrationDownloadDto
	) {
		const where = ArtistService.formatIdentifierToWhereInput(idOrSlug);
		const artistIllustrationPath = await this.artistService.buildIllustrationPath(where);

		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			artistIllustrationPath
		);
	}

	@ApiOperation({
		summary: "Get the album's illustration"
	})
	@Get('albums/:idOrSlug')
	async getAlbumIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const where = AlbumService.formatIdentifierToWhereInput(idOrSlug);
		const masterRelease = await this.releaseService.get({ masterOf: where });

		return this.getReleaseIllustration(
			{ idOrSlug: masterRelease.id },
			dimensions,
			res
		);
	}

	@ApiOperation({
		summary: "Get a song's illustration"
	})
	@Get('songs/:idOrSlug')
	async getSongIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const where = SongService.formatIdentifierToWhereInput(idOrSlug);
		const master = await this.trackService.getMasterTrack(where);

		return this.getTrackIllustration(
			{ idOrSlug: master.id },
			dimensions,
			res
		);
	}

	@ApiOperation({
		summary: "Get a release's illustration"
	})
	@Get('releases/:idOrSlug')
	async getReleaseIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const path = await this.releaseService.buildIllustrationPath(where);
		const release = await this.releaseService.get(where, { album: true });

		if (this.illustrationService.illustrationExists(path) == false) {
			throw new NoReleaseIllustrationException(
				new Slug(release.album.slug), new Slug(release.slug)
			);
		}
		return this.illustrationService.streamIllustration(
			path, release.slug, dimensions, res
		);
	}

	@ApiOperation({
		summary: "Change a release's illustration"
	})
	@Admin()
	@Post('releases/:idOrSlug')
	async updateReleaseIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Body()	illustrationDto: IllustrationDownloadDto
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const path = await this.releaseService.buildIllustrationPath(where);

		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			path
		);
	}

	@ApiOperation({
		summary: "Get a track's illustration"
	})
	@Get('tracks/:idOrSlug')
	async getTrackIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const where = TrackService.formatIdentifierToWhereInput(idOrSlug);
		const track = await this.trackService.get(where, { song: true });
		const trackIllustrationPath = await this.trackService.buildIllustrationPath(where);

		if (this.illustrationService.illustrationExists(trackIllustrationPath)) {
			return this.illustrationService.streamIllustration(
				trackIllustrationPath,
				track.song.slug,
				dimensions,
				res
			);
		}
		return this.getReleaseIllustration(
			{ idOrSlug: track.releaseId },
			dimensions,
			res
		);
	}

	@ApiOperation({
		summary: "Change a track's illustration"
	})
	@Admin()
	@Post('tracks/:idOrSlug')
	async updateTrackIllustration(
		@Param() { idOrSlug }: IdentifierParam,
		@Body()	illustrationDto: IllustrationDownloadDto
	) {
		const where = TrackService.formatIdentifierToWhereInput(idOrSlug);
		const trackIllustrationPath = await this.trackService.buildIllustrationPath(where);

		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			trackIllustrationPath
		);
	}

	@ApiOperation({
		summary: "Delete a track's illustration"
	})
	@Admin()
	@Delete('tracks/:idOrSlug')
	async deleteTrackIllustration(
		@Param() { idOrSlug }: IdentifierParam
	) {
		const where = TrackService.formatIdentifierToWhereInput(idOrSlug);
		const trackIllustrationPath = await this.trackService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(trackIllustrationPath);
	}

	@ApiOperation({
		summary: "Delete a release's illustration"
	})
	@Admin()
	@Delete('releases/:idOrSlug')
	async deleteReleaseIllustration(
		@Param() { idOrSlug }: IdentifierParam
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(idOrSlug);
		const releaseIllustrationPath = await this.releaseService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(releaseIllustrationPath);
	}

	@ApiOperation({
		summary: "Delete an artist's illustration"
	})
	@Admin()
	@Delete('artists/:idOrSlug')
	async deleteArtistIllustration(
		@Param() { idOrSlug }: IdentifierParam
	) {
		const where = ArtistService.formatIdentifierToWhereInput(idOrSlug);
		const artistIllustrationPath = await this.artistService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(artistIllustrationPath);
	}
}
