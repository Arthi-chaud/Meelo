import {
	Body, Controller, Delete, Get, Post, Query, Response
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
import { IdentifierParam } from "src/identifier/identifier-param.decorator";
import Admin from "src/roles/admin.decorator";
import Identifier from "src/identifier/models/identifier";
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
		@IdentifierParam()
		identifier: Identifier,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const where = ArtistService.formatIdentifierToWhereInput(identifier);
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
		@IdentifierParam()
		identifier: Identifier,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		const where = ArtistService.formatIdentifierToWhereInput(identifier);
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
		@IdentifierParam()
		identifier: Identifier,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const where = AlbumService.formatIdentifierToWhereInput(identifier);
		const masterRelease = await this.releaseService.get({ masterOf: where });

		return this.getReleaseIllustration(masterRelease.id, dimensions, res);
	}

	@ApiOperation({
		summary: "Get a song's illustration"
	})
	@Get('songs/:idOrSlug')
	async getSongIllustration(
		@IdentifierParam()
		identifier: Identifier,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const where = SongService.formatIdentifierToWhereInput(identifier);
		const master = await this.trackService.getMasterTrack(where);

		return this.getTrackIllustration(master.id, dimensions, res);
	}

	@ApiOperation({
		summary: "Get a release's illustration"
	})
	@Get('releases/:idOrSlug')
	async getReleaseIllustration(
		@IdentifierParam()
		identifier: Identifier,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(identifier);
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
		@IdentifierParam()
		identifier: Identifier,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(identifier);
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
		@IdentifierParam()
		identifier: Identifier,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const where = TrackService.formatIdentifierToWhereInput(identifier);
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
		return this.getReleaseIllustration(track.releaseId, dimensions, res);
	}

	@ApiOperation({
		summary: "Change a track's illustration"
	})
	@Admin()
	@Post('tracks/:idOrSlug')
	async updateTrackIllustration(
		@IdentifierParam()
		identifier: Identifier,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		const where = TrackService.formatIdentifierToWhereInput(identifier);
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
		@IdentifierParam()
		identifier: Identifier,
	) {
		const where = TrackService.formatIdentifierToWhereInput(identifier);
		const trackIllustrationPath = await this.trackService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(trackIllustrationPath);
	}

	@ApiOperation({
		summary: "Delete a release's illustration"
	})
	@Admin()
	@Delete('releases/:idOrSlug')
	async deleteReleaseIllustration(
		@IdentifierParam()
		identifier: Identifier,
	) {
		const where = ReleaseService.formatIdentifierToWhereInput(identifier);
		const releaseIllustrationPath = await this.releaseService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(releaseIllustrationPath);
	}

	@ApiOperation({
		summary: "Delete an artist's illustration"
	})
	@Admin()
	@Delete('artists/:idOrSlug')
	async deleteArtistIllustration(
		@IdentifierParam()
		identifier: Identifier,
	) {
		const where = ArtistService.formatIdentifierToWhereInput(identifier);
		const artistIllustrationPath = await this.artistService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(artistIllustrationPath);
	}
}
