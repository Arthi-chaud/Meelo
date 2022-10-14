import { Body, Controller, Get, Param, Post, Query, Response } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import ParseAlbumIdentifierPipe from "src/album/album.pipe";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import ParseArtistIdentifierPipe from "src/artist/artist.pipe";
import ArtistService from "src/artist/artist.service";
import { ParseIdPipe } from "src/identifier/id.pipe";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ParseReleaseIdentifierPipe from "src/release/release.pipe";
import ReleaseService from "src/release/release.service";
import Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import ParseSongIdentifierPipe from "src/song/song.pipe";
import TrackService from "src/track/track.service";
import { NoReleaseIllustrationException } from "./illustration.exceptions";
import IllustrationService from "./illustration.service";
import { IllustrationDownloadDto } from "./models/illustration-dl.dto";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";

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
		summary: "Get an artist\'s illustration"
	})
	@Get('artists/:idOrSlug')
	
	async getArtistIllustration(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const artist = await this.artistService.get(where);
		return this.illustrationService.streamIllustration(
			this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug)),
			artist.slug, dimensions, res
		);
	}

	@ApiOperation({
		summary: 'Change an artist\'s illustration'
	})
	@Post('artists/:idOrSlug')
	async updateArtistIllustration(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		const artist = await this.artistService.get(where);
		const artistIllustrationPath = this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug));
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
		@Param(ParseAlbumIdentifierPipe)
		where: AlbumQueryParameters.WhereInput,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const masterRelease = await this.releaseService.get({ byMasterOf: where });
		return this.getReleaseIllustration({ byId: { id: masterRelease.id } }, dimensions, res)
	}

	@ApiOperation({
		summary: "Get a song's illustration"
	})
	
	@Get('songs/:idOrSlug')
	async getSongIllustration(
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const master = await this.trackService.getMasterTrack(where);
		return this.getTrackIllustration(master.id, dimensions, res);
		
	}

	@ApiOperation({
		summary: "Get a release's illustration"
	})
	
	@Get('releases/:idOrSlug')
	async getReleaseIllustration(
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const path = await this.releaseService.buildIllustrationPath(where);
		const release = await this.releaseService.get(where, { album: true });
		if (this.illustrationService.illustrationExists(path) == false)
			throw new NoReleaseIllustrationException(new Slug(release.album.slug), new Slug(release.slug));
		return this.illustrationService.streamIllustration(
			path, release.slug, dimensions, res
		);
	}

	@ApiOperation({
		summary: "Change a release's illustration"
	})
	@Post('releases/:idOrSlug')
	async updateReleaseIllustration(
		@Param(ParseReleaseIdentifierPipe)
		where: ReleaseQueryParameters.WhereInput,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		const path = await this.releaseService.buildIllustrationPath(where);
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			path
		);
	}

	@ApiOperation({
		summary: "Get a track's illustration"
	})
	
	@Get('tracks/:id')
	async getTrackIllustration(
		@Param('id', ParseIdPipe)
		trackId: number,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true })
		res: Response,
	) {
		const track = await this.trackService.get({ id: trackId }, { song: true })
		const trackIllustrationPath = await this.trackService.buildIllustrationPath({ id: trackId });
		if (this.illustrationService.illustrationExists(trackIllustrationPath)) {
			return this.illustrationService.streamIllustration(
				trackIllustrationPath,
				track.song.slug, dimensions, res
			);
		}
		return this.getReleaseIllustration({ byId: { id: track.releaseId! } }, dimensions, res);
	}
	
	@ApiOperation({
		summary: "Change a track's illustration"
	})
	@Post('tracks/:id')
	async updateTrackIllustration(
		@Param('id', ParseIdPipe)
		trackId: number,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		const trackIllustrationPath = await this.trackService.buildIllustrationPath({ id: trackId });
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			trackIllustrationPath
		);
	}
}