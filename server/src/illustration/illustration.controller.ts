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
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import ReleaseIllustrationService from "src/release/release-illustration.service";
import TrackIllustrationService from "src/track/track-illustration.service";
import { parse } from 'path';
import Slug from "src/slug/slug";
import { NoReleaseIllustrationException, NoTrackIllustrationException } from "./illustration.exceptions";
import SongService from "src/song/song.service";
import SongQueryParameters from "src/song/models/song.query-params";
import ProviderIllustrationService from "src/providers/provider-illustration.service";
import ProviderService from "src/providers/provider.service";
import ProvidersSettings from "src/providers/models/providers.settings";
import { UnknownProviderError } from "src/providers/provider.exception";
import { MeeloException } from "src/exceptions/meelo-exception";
import PlaylistService from "src/playlist/playlist.service";
import PlaylistQueryParameters from "src/playlist/models/playlist.query-parameters";
import PlaylistIllustrationService from "src/playlist/playlist-illustration.service";

@ApiTags("Illustrations")
@Controller('illustrations')
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private releaseIllustrationService: ReleaseIllustrationService,
		private trackIllustrationService: TrackIllustrationService,
		private artistIllustrationService: ArtistIllustrationService,
		private playlistIllustrationService: PlaylistIllustrationService,
		private trackService: TrackService,
		private releaseService: ReleaseService,
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

		if (this.releaseIllustrationService.illustrationExists(illustrationPath)) {
			return this.illustrationService.streamIllustration(
				illustrationPath,
				parse(parse(illustrationPath).dir).name,
				dimensions,
				res
			);
		}
		const release = await this.releaseService.get(where, { album: true });
		const firstTrack = await this.trackService.getPlaylist(where)
			.then((tracklist) => tracklist.at(0));

		if (firstTrack) {
			return this.getTrackIllustration(dimensions, { id: firstTrack.id }, res);
		}
		throw new NoReleaseIllustrationException(
			new Slug(release.album.slug), new Slug(release.slug)
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
		const track = await this.trackService.get(where, { song: true });
		const [trackIdentifiers, releaseIdentifier] = await Promise.all([
			this.trackIllustrationService
				.formatWhereInputToIdentifiers(where),
			this.releaseIllustrationService
				.formatWhereInputToIdentifiers({ id: track.releaseId }),
		]);
		const trackIllustrationPath = this.trackIllustrationService
			.buildIllustrationPath(...trackIdentifiers);
		const discIllustrationPath = this.trackIllustrationService
			.buildDiscIllustrationPath(...trackIdentifiers);
		const releaseIllustrationPath = this.releaseIllustrationService
			.buildIllustrationPath(...releaseIdentifier);

		for (const illustrationPath of
			[trackIllustrationPath, discIllustrationPath, releaseIllustrationPath]
		) {
			if (this.trackIllustrationService.illustrationExists(illustrationPath)) {
				return this.illustrationService.streamIllustration(
					illustrationPath,
					track.song.slug,
					dimensions,
					res
				);
			}
		}
		throw new NoTrackIllustrationException(track.id);
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
		const playlistIllustration = await this.playlistIllustrationService
			.getIllustrationPath(where);

		return this.illustrationService.streamIllustration(
			playlistIllustration,
			parse(parse(playlistIllustration).dir).name,
			dimensions,
			res
		);
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
		const path = await this.playlistIllustrationService.getIllustrationPath(where);

		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			path
		);
	}
}
