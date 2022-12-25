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
import Admin from "src/roles/admin.decorator";
import AlbumService from "src/album/album.service";
import SongService from "src/song/song.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import IdentifierParam from "src/identifier/identifier.pipe";
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';

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
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response,
	) {
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
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
		@Body() illustrationDto: IllustrationDownloadDto
	) {
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
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
	) {
		const masterRelease = await this.releaseService.get({ masterOf: where });

		return this.getReleaseIllustration(
			{ id: masterRelease.id },
			dimensions,
			res
		);
	}

	@ApiOperation({
		summary: "Get a song's illustration"
	})
	@Get('songs/:idOrSlug')
	async getSongIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
	) {
		const master = await this.trackService.getMasterTrack(where);

		return this.getTrackIllustration(
			dimensions,
			{ id: master.id },
			res
		);
	}

	@ApiOperation({
		summary: "Get a release's illustration"
	})
	@Get('releases/:idOrSlug')
	async getReleaseIllustration(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
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
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Body()	illustrationDto: IllustrationDownloadDto
	) {
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
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
	) {
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
			{ id: track.releaseId },
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
		@Body()	illustrationDto: IllustrationDownloadDto,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput
	) {
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
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		const trackIllustrationPath = await this.trackService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(trackIllustrationPath);
	}

	@ApiOperation({
		summary: "Delete a release's illustration"
	})
	@Admin()
	@Delete('releases/:idOrSlug')
	async deleteReleaseIllustration(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		const releaseIllustrationPath = await this.releaseService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(releaseIllustrationPath);
	}

	@ApiOperation({
		summary: "Delete an artist's illustration"
	})
	@Admin()
	@Delete('artists/:idOrSlug')
	async deleteArtistIllustration(
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
	) {
		const artistIllustrationPath = await this.artistService.buildIllustrationPath(where);

		this.illustrationService.deleteIllustrationSafe(artistIllustrationPath);
	}
}
