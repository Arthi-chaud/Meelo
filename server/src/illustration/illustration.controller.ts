import {
	Body, Controller, Delete, Get, Post, Query, Response
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import ArtistService from "src/artist/artist.service";
import ReleaseService from "src/release/release.service";
import TrackService from "src/track/track.service";
import IllustrationService from "./illustration.service";
import { IllustrationDownloadDto } from "./models/illustration-dl.dto";
import { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";
import Admin from "src/roles/admin.decorator";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import ReleaseIllustrationService from "src/release/release-illustration.service";
import TrackIllustrationService from "src/track/track-illustration.service";
import { parse } from 'path';
import AlbumIllustrationService from "src/album/album-illustration.service";
import Slug from "src/slug/slug";
import { NoReleaseIllustrationException } from "./illustration.exceptions";
import SongService from "src/song/song.service";
import SongQueryParameters from "src/song/models/song.query-params";

@ApiTags("Illustrations")
@Controller('illustrations')
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private releaseIllustrationService: ReleaseIllustrationService,
		private trackIllustrationService: TrackIllustrationService,
		private artistIllustrationService: ArtistIllustrationService,
		private albumIllustrationService: AlbumIllustrationService,
		private trackService: TrackService,
		private releaseService: ReleaseService,
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
		const artistIllustration = await this.artistIllustrationService
			.getIllustrationPath(where);

		return this.illustrationService.streamIllustration(
			artistIllustration,
			parse(parse(artistIllustration).dir).name,
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
		const artistIllustration = await this.artistIllustrationService
			.getIllustrationPath(where);

		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			artistIllustration
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
		const illustrationPath = await this.albumIllustrationService
			.getIllustrationPath(where);

		return this.illustrationService.streamIllustration(
			illustrationPath,
			parse(parse(illustrationPath).dir).name,
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
		const illustrationPath = await this.releaseIllustrationService
			.getIllustrationPath(where);

		if (!this.releaseIllustrationService.illustrationExists(illustrationPath)) {
			const release = await this.releaseService.get(where, { album: true });

			throw new NoReleaseIllustrationException(
				new Slug(release.album.slug), new Slug(release.slug)
			);
		}
		return this.illustrationService.streamIllustration(
			illustrationPath,
			parse(parse(illustrationPath).dir).name,
			dimensions,
			res
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
		const path = await this.releaseIllustrationService.getIllustrationPath(where);

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
		const illustrationPath = await this.trackIllustrationService
			.getIllustrationPath(where);

		if (this.trackIllustrationService.illustrationExists(illustrationPath)) {
			const track = await this.trackService.get(where, { song: true });

			return this.illustrationService.streamIllustration(
				illustrationPath,
				track.song.slug,
				dimensions,
				res
			);
		}
		return this.getReleaseIllustration(
			{ id: (await this.trackService.select(where, { id: true })).id },
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
		const trackIllustrationPath = await this.trackIllustrationService
			.getIllustrationPath(where);

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
		const trackIllustrationPath = await this.trackIllustrationService
			.getIllustrationFolderPath(where);

		this.trackIllustrationService.deleteIllustrationFolder(trackIllustrationPath);
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
		const releaseIllustrationPath = await this.releaseIllustrationService
			.getIllustrationFolderPath(where);

		this.trackIllustrationService.deleteIllustrationFolder(releaseIllustrationPath);
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
		const artistIllustration = await this.artistIllustrationService
			.getIllustrationFolderPath(where);

		this.artistIllustrationService.deleteIllustrationFolder(artistIllustration);
	}
}
