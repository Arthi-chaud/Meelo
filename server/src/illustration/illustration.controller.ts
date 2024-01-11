/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	Body,
	Controller,
	Delete,
	Get,
	Header,
	HttpStatus,
	Param,
	Post,
	Query,
	Response,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import ArtistService from "src/artist/artist.service";
import ReleaseService from "src/release/release.service";
import TrackService from "src/track/track.service";
import IllustrationService from "./illustration.service";
import { IllustrationDownloadDto } from "./models/illustration-dl.dto";
import { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";
import Admin from "src/authentication/roles/admin.decorator";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import { parse } from "path";
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

const Cached = () => Header("Cache-Control", `max-age=${3600 * 24}`);

@ApiTags("Illustrations")
@Controller("illustrations")
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private artistService: ArtistService,
		private releaseService: ReleaseService,
		private trackService: TrackService,
		private playlistService: PlaylistService,
		private illustrationRepository: IllustrationRepository,
		private providerIllustrationService: ProviderIllustrationService,
		private providerService: ProviderService,
	) {}

	@ApiOperation({
		summary: "Get an artist's illustration",
	})
	@Cached()
	@Get("artists/:idOrSlug")
	async getArtistIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response,
	) {
		const artist = await this.artistService.get(where, {
			illustration: true,
		});
		const artistIllustrationPath =
			this.illustrationRepository.buildArtistIllustrationPath(
				artist.slug,
			);

		if (!artist.illustration) {
			throw new NoIllustrationException(
				"No Illustration registered for artist " + artist.slug,
			);
		}
		return this.illustrationService
			.streamIllustration(
				artistIllustrationPath,
				parse(parse(artistIllustrationPath).dir).name,
				dimensions,
				res,
			)
			.catch((err) => {
				if (err instanceof NoIllustrationException) {
					this.illustrationRepository.deleteArtistIllustration(
						where,
						{ withFolder: false },
					);
				}
				throw new NoIllustrationException(
					"No Illustration registered for artist " + artist.slug,
				);
			});
	}

	@ApiOperation({
		summary: "Change an artist's illustration",
	})
	@Admin()
	@Post("artists/:idOrSlug")
	async updateArtistIllustration(
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
		@Body() illustrationDto: IllustrationDownloadDto,
	) {
		return this.illustrationService
			.downloadIllustration(illustrationDto.url)
			.then((buffer) =>
				this.illustrationRepository.createArtistIllustration(
					buffer,
					where,
				),
			);
	}

	@ApiOperation({
		summary: "Get the album's illustration",
	})
	@Cached()
	@Get("albums/:idOrSlug")
	async getAlbumIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
	) {
		const master = await this.releaseService.getMasterRelease(where);

		return this.getReleaseIllustration({ id: master.id }, dimensions, res);
	}

	@ApiOperation({
		summary: "Get a song's illustration",
	})
	@Cached()
	@Get("songs/:idOrSlug")
	async getSongIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
	) {
		const master = await this.trackService.getMasterTrack(where);

		return this.getTrackIllustration(dimensions, { id: master.id }, res);
	}

	@ApiOperation({
		summary: "Get a release's illustration",
	})
	@ApiParam({
		name: "disc",
		required: false,
	})
	@Cached()
	@Get("releases/:idOrSlug")
	async getReleaseIllustration(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const illustration =
			await this.illustrationRepository.getReleaseIllustrationResponse(
				where,
			);

		if (!illustration) {
			throw new NoIllustrationException(
				"No Illustration registered for this release.",
			);
		}
		const illustrationPath =
			await this.illustrationRepository.resolveReleaseIllustrationPath(
				illustration.id,
			);

		return this.illustrationService
			.streamIllustration(
				illustrationPath,
				parse(parse(illustrationPath).dir).name,
				dimensions,
				res,
			)
			.catch(() => {
				this.illustrationRepository.deleteReleaseIllustration(
					where,
					{ withFolder: false },
					illustration.disc,
				);
				throw new NoIllustrationException(
					"No Illustration registered for this release.",
				);
			});
	}

	@ApiOperation({
		summary: "Change a release's illustration",
	})
	@Admin()
	@Post("releases/:idOrSlug")
	async updateReleaseIllustration(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Body() illustrationDto: IllustrationDownloadDto,
	) {
		const buffer = await this.illustrationService.downloadIllustration(
			illustrationDto.url,
		);

		await this.illustrationRepository.createReleaseIllustration(
			buffer,
			null,
			where,
		);
	}

	@ApiOperation({
		summary: "Get a track's illustration",
	})
	@Cached()
	@Get("tracks/:idOrSlug")
	async getTrackIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
	) {
		const illustration =
			await this.illustrationRepository.getTrackIllustration(where);

		if (!illustration) {
			throw new NoIllustrationException(
				"No Illustration registered for this track.",
			);
		}
		const illustrationPath =
			await this.illustrationRepository.resolveReleaseIllustrationPath(
				illustration.id,
			);
		return this.illustrationService
			.streamIllustration(
				illustrationPath,
				`release-${illustration.releaseId}-disc-${
					illustration.disc ?? 0
				}-track-${illustration.track ?? 0}`,
				dimensions,
				res,
			)
			.catch(() => {
				this.illustrationRepository.deleteTrackIllustration(where);
				throw new NoIllustrationException(
					"No Illustration registered for this track.",
				);
			});
	}

	@ApiOperation({
		summary: "Change a track's illustration",
	})
	@Admin()
	@Post("tracks/:idOrSlug")
	async updateTrackIllustration(
		@Body() illustrationDto: IllustrationDownloadDto,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		const buffer = await this.illustrationService.downloadIllustration(
			illustrationDto.url,
		);

		return this.illustrationRepository.createTrackIllustration(
			buffer,
			where,
		);
	}

	@ApiOperation({
		summary: "Delete a track's illustration",
	})
	@Admin()
	@Delete("tracks/:idOrSlug")
	async deleteTrackIllustration(
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		await this.illustrationRepository.deleteTrackIllustration(where);
	}

	@ApiOperation({
		summary: "Delete a release's illustration",
	})
	@Admin()
	@Delete("releases/:idOrSlug")
	async deleteReleaseIllustration(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		await this.illustrationRepository.deleteReleaseIllustration(where, {
			withFolder: false,
		});
	}

	@ApiOperation({
		summary: "Delete an artist's illustration",
	})
	@Admin()
	@Delete("artists/:idOrSlug")
	async deleteArtistIllustration(
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
	) {
		await this.illustrationRepository.deleteArtistIllustration(where, {
			withFolder: false,
		});
	}

	@ApiOperation({
		summary: "Get a Provider's icon or banner",
	})
	@ApiParam({
		name: "type",
		enum: ["icon", "banner"],
	})
	@Cached()
	@Get("providers/:name/:type")
	async getProviderIillustration(
		@Param("name") providerName: string,
		@Param("type") type: string,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const pNameIsValid = (str: string): str is keyof ProvidersSettings =>
			this.providerService.providerCatalogue.find(
				({ name }) => name == str,
			) !== undefined;
		let illustrationPath = "";

		if (!pNameIsValid(providerName)) {
			throw new UnknownProviderError(providerName);
		}
		switch (type) {
			case "icon":
				illustrationPath =
					this.providerIllustrationService.buildIconPath(
						providerName,
					);
				break;
			case "banner":
				illustrationPath =
					this.providerIllustrationService.buildBannerPath(
						providerName,
					);
				break;
			default:
				throw new MeeloException(
					HttpStatus.BAD_REQUEST,
					"Invalid Provider Illustration type",
				);
		}
		return this.illustrationService.streamIllustration(
			illustrationPath,
			`${providerName}-${parse(illustrationPath).name}`,
			dimensions,
			res,
			parse(illustrationPath).ext,
		);
	}

	@ApiOperation({
		summary: "Get a playlist's illustration",
	})
	@Cached()
	@Get("playlists/:idOrSlug")
	async getPlaylistIllustration(
		@Query() dimensions: IllustrationDimensionsDto,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response,
	) {
		const playlistIllustration =
			await this.illustrationRepository.getPlaylistIllustration(where);

		if (!playlistIllustration) {
			throw new NoIllustrationException(
				"No Illustration registered for this playlist.",
			);
		}
		const playlist = await this.playlistService.get(where);
		const playlistIllustrationPath =
			this.illustrationRepository.getPlaylistIllustrationPath(
				playlist.slug,
			);

		return this.illustrationService
			.streamIllustration(
				playlistIllustrationPath,
				parse(parse(playlistIllustrationPath).dir).name,
				dimensions,
				res,
			)
			.catch(() => {
				this.illustrationRepository.deletePlaylistIllustration(where);
				throw new NoIllustrationException(
					"No Illustration registered for this playlist.",
				);
			});
	}

	@ApiOperation({
		summary: "Change a playlist's illustration",
	})
	@Admin()
	@Post("playlists/:idOrSlug")
	async updatePlaylistIllustration(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Body() illustrationDto: IllustrationDownloadDto,
	) {
		const buffer = await this.illustrationService.downloadIllustration(
			illustrationDto.url,
		);

		return this.illustrationRepository.createPlaylistIllustration(
			buffer,
			where,
		);
	}
}
