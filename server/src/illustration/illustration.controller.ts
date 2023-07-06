import {
	Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Response
} from "@nestjs/common";
import {
	ApiOperation, ApiParam, ApiTags
} from "@nestjs/swagger";
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
import { parse } from 'path';
import { NoIllustrationException } from "./illustration.exceptions";
import ProviderIllustrationService from "src/providers/provider-illustration.service";
import ProviderService from "src/providers/provider.service";
import ProvidersSettings from "src/providers/models/providers.settings";
import { UnknownProviderError } from "src/providers/provider.exception";
import { MeeloException } from "src/exceptions/meelo-exception";
import PlaylistService from "src/playlist/playlist.service";
import PlaylistQueryParameters from "src/playlist/models/playlist.query-parameters";
import IllustrationRepository from "./illustration.repository";
import SongService from "src/song/song.service";
import SongQueryParameters from "src/song/models/song.query-params";
import { IsNumber, IsOptional } from "class-validator";

class DiscDto {
	@IsNumber()
	@IsOptional()
	disc?: number;
}

@ApiTags("Illustrations")
@Controller('illustrations')
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private artistService: ArtistService,
		private releaseService: ReleaseService,
		private trackService: TrackService,
		private playlistService: PlaylistService,
		private illustrationRepository: IllustrationRepository,
		private providerIllustrationService: ProviderIllustrationService,
		private providerService: ProviderService
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
		const artist = await this.artistService.get(where, { illustration: true });
		const artistIllustrationPath = this.illustrationRepository
			.getArtistIllustrationPath(artist.slug);

		if (!artist.illustration) {
			throw new NoIllustrationException("No Illustration registered for artist " + artist.slug);
		}
		return this.illustrationService.streamIllustration(
			artistIllustrationPath,
			parse(parse(artistIllustrationPath).dir).name,
			dimensions,
			res
		).catch((err) => {
			if (err instanceof NoIllustrationException) {
				this.illustrationRepository.deleteArtistIllustration(where, { withFolder: false });
			}
			throw new NoIllustrationException("No Illustration registered for artist " + artist.slug);
		});
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
		return this.illustrationService.downloadIllustration(
			illustrationDto.url
		).then((buffer) => this.illustrationRepository.createArtistIllustration(buffer, where));
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
		const master = await this.releaseService.getMasterRelease(where);

		return this.getReleaseIllustration(
			{ id: master.id },
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
			res,
		);
	}

	@ApiOperation({
		summary: "Get a release's illustration"
	})
	@ApiParam({
		name: 'disc',
		required: false
	})
	@Get('releases/:idOrSlug/:disc?')
	async getReleaseIllustration(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
		@Param() disc?: DiscDto
	) {
		const illustration = await this.illustrationRepository.getReleaseIllustration(
			where, disc?.disc
		);

		if (!illustration) {
			throw new NoIllustrationException("No Illustration registered for this release.");
		}
		const illustrationPath = await this.illustrationRepository
			.resolveReleaseIllustrationPath(illustration);

		return this.illustrationService.streamIllustration(
			illustrationPath,
			parse(parse(illustrationPath).dir).name,
			dimensions,
			res
		).catch(() => {
			this.illustrationRepository.deleteReleaseIllustration(
				where, { withFolder: false }, illustration.disc
			);
			throw new NoIllustrationException("No Illustration registered for this release.");
		});
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
		const buffer = await this.illustrationService.downloadIllustration(illustrationDto.url);

		await this.illustrationRepository.createReleaseIllustration(buffer, where);
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
		const [
			__,
			___,
			discIllustrationPath,
			trackIllustrationPath
		] = await this.illustrationRepository.getTrackIllustrationPaths(where);
		const illustration = await this.illustrationRepository.getTrackIllustration(where);

		if (!illustration) {
			throw new NoIllustrationException("No Illustration registered for this track.");
		}
		if (illustration.url.includes('/tracks/')) { // Cheap trick to know if track or release illustration
			return this.illustrationService.streamIllustration(
				trackIllustrationPath,
				track.song.slug,
				dimensions,
				res
			).catch(() => {
				this.illustrationRepository.deleteTrackIllustration(where);
				throw new NoIllustrationException("No Illustration registered for this track.");
			});
		} else if (track.discIndex !== null) {
			const discIllustration = await this.illustrationRepository.getReleaseIllustration(
				{ id: track.releaseId }, track.discIndex
			);

			if (discIllustration) {
				return this.illustrationService.streamIllustration(
					discIllustrationPath,
					track.song.slug,
					dimensions,
					res
				).catch(() => {
					this.illustrationRepository.deleteReleaseIllustration(
						{ id: track.releaseId }, { withFolder: false }, track.discIndex
					);
					throw new NoIllustrationException("No Illustration registered for this track.");
				});
			}
		}
		return this.getReleaseIllustration({ id: track.releaseId }, dimensions, res);
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
		const buffer = await this.illustrationService.downloadIllustration(illustrationDto.url);

		return this.illustrationRepository.createTrackIllustration(
			buffer,
			where
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
		await this.illustrationRepository.deleteTrackIllustration(
			where
		);
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
		await this.illustrationRepository.deleteReleaseIllustration(
			where, { withFolder: false }
		);
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
		await this.illustrationRepository.deleteArtistIllustration(
			where, { withFolder: false }
		);
	}

	@ApiOperation({
		summary: "Get a Provider's icon or banner"
	})
	@ApiParam({
		name: 'type',
		enum: ['icon', 'banner'],
	})
	@Get('providers/:name/:type')
	async getProviderIillustration(
		@Param('name') providerName: string,
		@Param('type') type: string,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response
	) {
		const pNameIsValid = (str: string): str is keyof ProvidersSettings =>
			this.providerService.enabledProviders.includes(str as any);
		let illustrationPath = '';

		if (!pNameIsValid(providerName)) {
			throw new UnknownProviderError(providerName);
		}
		switch (type) {
		case 'icon':
			illustrationPath = this.providerIllustrationService.buildIconPath(providerName);
			break;
		case 'banner':
			illustrationPath = this.providerIllustrationService.buildBannerPath(providerName);
			break;
		default:
			throw new MeeloException(HttpStatus.BAD_REQUEST, 'Invalid Provider Illustration type');
		}
		return this.illustrationService.streamIllustration(
			illustrationPath,
			`${providerName}-${parse(illustrationPath).name}`,
			dimensions,
			res,
			parse(illustrationPath).ext
		);
	}

	@ApiOperation({
		summary: "Get a playlist's illustration"
	})
	@Get('playlists/:idOrSlug')
	async getPlaylistIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response,
	) {
		const playlistIllustration = await this.illustrationRepository
			.getPlaylistIllustration(where);

		if (!playlistIllustration) {
			throw new NoIllustrationException("No Illustration registered for this playlist.");
		}
		const playlist = await this.playlistService.get(where);
		const playlistIllustrationPath = this.illustrationRepository
			.getPlaylistIllustrationPath(playlist.slug);

		return this.illustrationService.streamIllustration(
			playlistIllustrationPath,
			parse(parse(playlistIllustrationPath).dir).name,
			dimensions,
			res
		).catch(() => {
			this.illustrationRepository.deletePlaylistIllustration(where);
			throw new NoIllustrationException("No Illustration registered for this playlist.");
		});
	}

	@ApiOperation({
		summary: "Change a playlist's illustration"
	})
	@Admin()
	@Post('playlists/:idOrSlug')
	async updatePlaylistIllustration(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Body()	illustrationDto: IllustrationDownloadDto
	) {
		const buffer = await this.illustrationService.downloadIllustration(illustrationDto.url);

		return this.illustrationRepository.createPlaylistIllustration(
			buffer,
			where
		);
	}
}
