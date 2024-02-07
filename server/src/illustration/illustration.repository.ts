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

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import {
	ArtistIllustration,
	PlaylistIllustration,
	ReleaseIllustration,
} from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import IllustrationService from "./illustration.service";
import SettingsService from "src/settings/settings.service";
import { dirname, join } from "path";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import Logger from "src/logger/logger";
import { IllustrationResponse } from "./models/illustration.response";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import TrackService from "src/track/track.service";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import SongQueryParameters from "src/song/models/song.query-params";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ProviderService from "src/providers/provider.service";
import FfmpegService from "src/scanner/ffmpeg.service";
import PlaylistQueryParameters from "src/playlist/models/playlist.query-parameters";
import PlaylistService from "src/playlist/playlist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import ScannerService from "src/scanner/scanner.service";
import md5 from "md5";

/**
 * This service handles the paths to illustrations files and the related tables in the DB
 */
@Injectable()
export default class IllustrationRepository {
	private readonly logger = new Logger(IllustrationRepository.name);
	private readonly illustrationFileName = "cover.jpg";
	private readonly baseIllustrationFolderPath: string;
	constructor(
		private prismaService: PrismaService,
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => PlaylistService))
		private playlistService: PlaylistService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
		private ffmpegService: FfmpegService,
		private scannerService: ScannerService,
		private fileManagerService: FileManagerService,
	) {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			"metadata",
		);
	}

	/**
	 * Get Absolute path to an artist's illustration
	 */
	getPlaylistIllustrationPath(playlistSlug: string) {
		return join(
			this.baseIllustrationFolderPath,
			"_playlists",
			playlistSlug,
			this.illustrationFileName,
		);
	}

	/**
	 * Get Absolute path to a playlist's illustration
	 */
	buildArtistIllustrationPath(artistSlug: string | undefined) {
		return join(
			this.baseIllustrationFolderPath,
			artistSlug ?? compilationAlbumArtistKeyword,
			this.illustrationFileName,
		);
	}

	buildAlbumIllustrationFolderPath(
		artistSlug: string | undefined,
		albumSlug: string,
	): string {
		return join(
			dirname(this.buildArtistIllustrationPath(artistSlug)),
			albumSlug,
		);
	}

	buildReleaseIllustrationPath(
		artistSlug: string | undefined,
		albumSlug: string,
		releaseSlug: string,
	): string {
		return join(
			this.buildAlbumIllustrationFolderPath(artistSlug, albumSlug),
			releaseSlug,
			this.illustrationFileName,
		);
	}

	buildDiscIllustrationPath(
		artistSlug: string | undefined,
		albumSlug: string,
		releaseSlug: string,
		discIndex?: number,
	): string {
		return join(
			dirname(
				this.buildReleaseIllustrationPath(
					artistSlug,
					albumSlug,
					releaseSlug,
				),
			),
			`disc-${discIndex ?? 0}`,
			this.illustrationFileName,
		);
	}

	buildTrackIllustrationPath(
		artistSlug: string | undefined,
		albumSlug: string,
		releaseSlug: string,
		discIndex?: number,
		trackIndex?: number,
	): string {
		return join(
			dirname(
				this.buildDiscIllustrationPath(
					artistSlug,
					albumSlug,
					releaseSlug,
					discIndex,
				),
			),
			`track-${trackIndex ?? 0}`,
			this.illustrationFileName,
		);
	}

	/**
	 * Get the artist's Illustration row
	 * @param where the query input of the artist
	 * @returns null if the illustration does not exist
	 */
	async getArtistIllustration(
		where: ArtistQueryParameters.WhereInput,
	): Promise<(ArtistIllustration & IllustrationResponse) | null> {
		if (where.compilationArtist == true) {
			return null;
		}
		const illustration =
			await this.prismaService.artistIllustration.findFirst({
				where: { artist: ArtistService.formatWhereInput(where) },
				include: { artist: true },
			});

		if (!illustration) {
			return null;
		}
		const { artist, ...value } = illustration;

		return {
			...value,
			url: "/illustrations/artists/" + artist.slug,
		};
	}

	async getPlaylistIllustration(
		where: PlaylistQueryParameters.WhereInput,
	): Promise<(PlaylistIllustration & IllustrationResponse) | null> {
		const illustration =
			await this.prismaService.playlistIllustration.findFirst({
				where: {
					playlist: this.playlistService.formatWhereInput(where),
				},
				include: { playlist: true },
			});

		if (!illustration) {
			return null;
		}
		const { playlist, ...value } = illustration;

		return {
			...value,
			url: "/illustrations/playlists/" + playlist.slug,
		};
	}

	async getReleaseIllustrationResponse(
		where: ReleaseQueryParameters.WhereInput,
		disc?: number,
	) {
		return this.getReleaseIllustration(where, disc);
	}

	private async getReleaseIllustration(
		where: ReleaseQueryParameters.WhereInput,
		disc?: number, // This is only used internally
	): Promise<(ReleaseIllustration & IllustrationResponse) | null> {
		return this.prismaService.releaseIllustration
			.findFirst({
				where: {
					release: ReleaseService.formatWhereInput(where),
					track: null, // We want to avoid track-specific illustrations
					...(disc === 1
						? { OR: [{ disc: null }, { disc: 1 }] }
						: { disc }),
				},
				orderBy: { disc: { nulls: "first", sort: "asc" } },
			})
			.then(
				(value) =>
					value && {
						...value,
						url:
							`/illustrations/releases/${value.releaseId}` +
							(disc && disc != 1 ? `?disc=${disc}` : ""),
					},
			);
	}

	async resolveReleaseIllustrationPath(releaseIllustrationId: number) {
		const data =
			await this.prismaService.releaseIllustration.findFirstOrThrow({
				where: { id: releaseIllustrationId },
				select: {
					disc: true,
					track: true,
					release: {
						select: {
							slug: true,
							album: {
								select: {
									slug: true,
									artist: {
										select: {
											slug: true,
										},
									},
								},
							},
						},
					},
				},
			});
		if (data?.track) {
			return this.buildTrackIllustrationPath(
				data.release.album.artist?.slug,
				data.release.album.slug,
				data.release.slug,
				data.disc ?? undefined,
				data.track,
			);
		} else if (data?.disc) {
			return this.buildDiscIllustrationPath(
				data.release.album.artist?.slug,
				data.release.album.slug,
				data.release.slug,
				data.disc,
			);
		}
		return this.buildReleaseIllustrationPath(
			data.release.album.artist?.slug,
			data.release.album.slug,
			data.release.slug,
		);
	}

	async getSongIllustration(where: SongQueryParameters.WhereInput) {
		return this.trackService
			.getMasterTrack(where)
			.then((track) => this.getTrackIllustration({ id: track.id }))
			.catch(() => null);
	}

	async getAlbumIllustration(
		where: AlbumQueryParameters.WhereInput,
	): Promise<(ReleaseIllustration & IllustrationResponse) | null> {
		return this.releaseService
			.getMasterRelease(where)
			.then((release) => this.getReleaseIllustration({ id: release.id }));
	}

	/**
	 * If the track does not have a specific illustration, fallback on parent disc, then release
	 */
	async getTrackIllustration(where: TrackQueryParameters.WhereInput) {
		const track = await this.trackService.get(where);

		return this.prismaService.releaseIllustration
			.findFirst({
				where: {
					release: {
						tracks: { some: TrackService.formatWhereInput(where) },
					},
					OR: [
						{ disc: track.discIndex, track: track.trackIndex },
						{ disc: track.discIndex, track: null },
						{ disc: null, track: null },
					],
				},
				orderBy: { disc: { nulls: "last", sort: "asc" } },
			})
			.then((value) => {
				if (!value) {
					return null;
				}
				if (value.track) {
					return {
						...value,
						url: "/illustrations/tracks/" + track.id,
					};
				}
				return {
					...value,
					url:
						`/illustrations/releases/${track.releaseId}` +
						(value.disc && value.disc != 1
							? `?disc=${value.disc}`
							: ""),
				};
			});
	}

	async createArtistIllustration(
		buffer: Buffer,
		where: ArtistQueryParameters.WhereInput,
	): Promise<ArtistIllustration> {
		const artist = await this.artistService.get(where);
		const artistIllustrationPath = this.buildArtistIllustrationPath(
			artist.slug,
		);
		const { blurhash, colors, aspectRatio } =
			await this.illustrationService.getImageStats(buffer);

		this.illustrationService.saveIllustration(
			buffer,
			artistIllustrationPath,
		);
		return this.prismaService.artistIllustration.upsert({
			create: {
				blurhash,
				colors,
				aspectRatio,
				artistId: artist.id,
			},
			where: { artistId: artist.id },
			update: { blurhash, colors, aspectRatio },
		});
	}

	async createPlaylistIllustration(
		buffer: Buffer,
		where: PlaylistQueryParameters.WhereInput,
	): Promise<PlaylistIllustration> {
		const playlist = await this.playlistService.get(where);
		const playlistIllustrationPath = this.getPlaylistIllustrationPath(
			playlist.slug,
		);
		const { blurhash, colors, aspectRatio } =
			await this.illustrationService.getImageStats(buffer);

		this.illustrationService.saveIllustration(
			buffer,
			playlistIllustrationPath,
		);
		return this.prismaService.playlistIllustration.upsert({
			create: {
				blurhash,
				colors,
				aspectRatio,
				playlistId: playlist.id,
			},
			where: { playlistId: playlist.id },
			update: { blurhash, colors, aspectRatio },
		});
	}

	async createReleaseIllustration(
		buffer: Buffer,
		disc: number | null,
		where: ReleaseQueryParameters.WhereInput,
	): Promise<ReleaseIllustration> {
		const release = await this.releaseService.get(where, { album: true });
		const artist = release.album.artistId
			? await this.artistService.get({ id: release.album.artistId })
			: null;
		const releaseIllustrationPath = disc
			? this.buildDiscIllustrationPath(
					artist?.slug,
					release.album.slug,
					release.slug,
					disc,
			  )
			: this.buildReleaseIllustrationPath(
					artist?.slug,
					release.album.slug,
					release.slug,
			  );
		const { blurhash, colors, aspectRatio, hash } =
			await this.illustrationService.getImageStats(buffer);
		const previousIllustration = await this.getReleaseIllustration(
			where,
			disc ?? undefined,
		);

		this.illustrationService.saveIllustration(
			buffer,
			releaseIllustrationPath,
		);
		if (previousIllustration && previousIllustration.disc == disc) {
			return this.prismaService.releaseIllustration.update({
				where: { id: previousIllustration.id },
				data: { blurhash, colors, aspectRatio, hash },
			});
		}
		return this.prismaService.releaseIllustration.create({
			data: {
				blurhash,
				colors,
				aspectRatio,
				hash,
				releaseId: release.id,
				disc: disc,
			},
		});
	}

	// Creates track-specific illustration
	async createTrackIllustration(
		buffer: Buffer,
		where: TrackQueryParameters.WhereInput,
	): Promise<ReleaseIllustration> {
		const track = await this.trackService.get(where);
		const release = await this.releaseService.get(
			{ id: track.releaseId },
			{ album: true },
		);
		const artist = release.album.artistId
			? await this.artistService.get({ id: release.album.artistId })
			: null;
		const { blurhash, colors, aspectRatio, hash } =
			await this.illustrationService.getImageStats(buffer);

		this.illustrationService.saveIllustration(
			buffer,
			this.buildTrackIllustrationPath(
				artist?.slug,
				release.album.slug,
				release.slug,
				track.discIndex ?? undefined,
				track.trackIndex ?? undefined,
			),
		);
		const previousTrackIllustration = await this.getTrackIllustration(
			where,
		);

		if (previousTrackIllustration && previousTrackIllustration.track) {
			return this.prismaService.releaseIllustration.update({
				where: {
					id: previousTrackIllustration.id,
				},
				data: { blurhash, colors, aspectRatio, hash },
			});
		}
		return this.prismaService.releaseIllustration.create({
			data: {
				blurhash,
				colors,
				aspectRatio,
				hash,
				releaseId: track.releaseId,
				disc: track.discIndex,
				track: track.trackIndex,
			},
		});
	}

	/**
	 * Deletes Artist Illustration (File + info in DB)
	 */
	async deleteArtistIllustration(
		where: ArtistQueryParameters.WhereInput,
		opt: { withFolder: boolean },
	): Promise<void> {
		const artist = await this.artistService.get(where);
		const illustrationPath = this.buildArtistIllustrationPath(artist.slug);

		if (opt.withFolder) {
			this.illustrationService.deleteIllustrationFolder(
				dirname(illustrationPath),
			);
		} else {
			this.illustrationService.deleteIllustration(illustrationPath);
		}
		this.prismaService.artistIllustration
			.delete({
				where: { artistId: artist.id },
			})
			.catch(() => {});
	}

	/**
	 * Deletes Playlist Illustration (File + info in DB)
	 */
	async deletePlaylistIllustration(
		where: PlaylistQueryParameters.WhereInput,
	): Promise<void> {
		const playlist = await this.playlistService.get(where);
		const illustrationPath = this.getPlaylistIllustrationPath(
			playlist.slug,
		);

		this.illustrationService.deleteIllustrationFolder(
			dirname(illustrationPath),
		);
		this.prismaService.playlistIllustration
			.delete({
				where: { playlistId: playlist.id },
			})
			.catch(() => {});
	}

	/**
	 * Deletes Album Illustrations (File + info in DB)
	 */
	async deleteAlbumIllustrations(
		where: AlbumQueryParameters.WhereInput,
	): Promise<void> {
		const releases = await this.releaseService.getMany({ album: where });

		await Promise.all(
			releases.map((release) =>
				this.deleteReleaseIllustration(
					{ id: release.id },
					{ withFolder: true },
				),
			),
		);
	}

	/**
	 * Deletes Release Illustration (File + info in DB)
	 */
	async deleteReleaseIllustration(
		where: ReleaseQueryParameters.WhereInput,
		opt: { withFolder: boolean },
		discNumber?: number | null,
	): Promise<void> {
		const release = await this.prismaService.release
			.findFirstOrThrow({
				where: ReleaseService.formatWhereInput(where),
				include: {
					album: { include: { artist: true } },
					tracks: { take: 1 },
				},
			})
			.catch(async (err) => {
				throw await this.releaseService.onNotFound(err, where);
			});
		const illustrationPath = discNumber
			? // If disc is specified, we target its directory
			  this.buildDiscIllustrationPath(
					release.album.artist?.slug,
					release.album.slug,
					release.slug,
					discNumber,
					// Else, we get the release's folder
			  )
			: this.buildReleaseIllustrationPath(
					release.album.artist?.slug,
					release.album.slug,
					release.slug,
			  );

		if (opt.withFolder) {
			this.illustrationService.deleteIllustrationFolder(
				dirname(illustrationPath),
			);
		} else {
			this.illustrationService.deleteIllustration(illustrationPath);
		}
		this.prismaService.releaseIllustration
			.deleteMany({
				where: {
					release: ReleaseService.formatWhereInput(where),
					disc: discNumber,
				},
			})
			.catch(() => {});
	}

	/**
	 * Deletes Track Illustration (File + info in DB)
	 */
	async deleteTrackIllustration(
		where: TrackQueryParameters.WhereInput,
	): Promise<void> {
		const illustration = await this.getTrackIllustration(where);

		if (!illustration) {
			return;
		}
		const illustrationPath = await this.resolveReleaseIllustrationPath(
			illustration.id,
		);

		this.illustrationService.deleteIllustrationFolder(
			dirname(illustrationPath),
		);
		this.prismaService.releaseIllustration
			.delete({
				where: {
					id: illustration.id,
				},
			})
			.catch(() => {});
	}

	/**
	 * Extract the illustration embedded into/in the same folder as the source file
	 * Then creates illustration item in DB (according to the type (release, disc, or track))
	 * @returns the path of the saved file
	 */
	async registerTrackFileIllustration(
		where: TrackQueryParameters.WhereInput,
		sourceFilePath: string,
	): Promise<void> {
		const previousIllustrationItem = await this.getTrackIllustration(where);
		const [embeddedIllustration, inlineIllustration] = await Promise.all([
			this.scannerService.extractIllustrationFromFile(sourceFilePath),
			this.scannerService.extractIllustrationInFileFolder(sourceFilePath),
		]);
		const extractedIllustration =
			(this.settingsService.settingsValues.metadata.source == "embedded"
				? embeddedIllustration
				: inlineIllustration) ??
			(this.settingsService.settingsValues.metadata.order == "preferred"
				? embeddedIllustration ?? inlineIllustration
				: null);

		if (extractedIllustration == null) {
			return;
		}
		const track = await this.trackService.get(where, { release: true });
		const illustrationBytes = extractedIllustration;
		if (!previousIllustrationItem) {
			await this.createReleaseIllustration(illustrationBytes, null, {
				id: track.releaseId,
			});
		} else {
			// const jimpImage = await Jimp.read(illustrationBytes);
			if (md5(illustrationBytes) == previousIllustrationItem.hash) {
				// The image has already been registered
				return;
			}
			// If the previous illustration is already track-specific
			if (
				previousIllustrationItem.disc &&
				previousIllustrationItem.track
			) {
				this.logger.error(
					`An Illustration for '${track.name}' already exist... Skipping.`,
				);
				return;
			} else if (previousIllustrationItem?.disc) {
				// If the previous illustration is already disc-specific
				await this.createTrackIllustration(illustrationBytes, {
					id: track.id,
				});
			} else {
				// If the previous illustration is release only,
				// We create one for the disc
				await this.createReleaseIllustration(
					illustrationBytes,
					track.discIndex,
					{
						id: track.releaseId,
					},
				);
			}
		}
		this.logger.verbose(
			`Extracting Illustration for '${track.release.name}' successful.`,
		);
	}

	async registerVideoTrackScreenshot(
		where: TrackQueryParameters.WhereInput,
		sourceFilePath: string,
	): Promise<ReleaseIllustration | null> {
		const track = await this.trackService.get(where);

		if (track.type != "Video") {
			return null;
		}
		const tmpFilePath = join(
			this.settingsService.settingsValues.meeloFolder,
			"tmp",
			track.id + ".jpg",
		);
		await this.ffmpegService.takeVideoScreenshot(
			sourceFilePath,
			tmpFilePath,
		);
		return this.createTrackIllustration(
			await this.fileManagerService.getFileBuffer(tmpFilePath),
			where,
		).then((res) => {
			this.fileManagerService.deleteFile(tmpFilePath);
			return res;
		});
	}

	/**
	 * Move an album's illustrations folder to another artist
	 */
	reassignAlbumIllustration(
		albumSlug: string,
		previousArtistSlug: string | undefined,
		newArtistSlug: string | undefined,
	) {
		const oldPath = this.buildAlbumIllustrationFolderPath(
			previousArtistSlug,
			albumSlug,
		);
		const newPath = this.buildAlbumIllustrationFolderPath(
			newArtistSlug,
			albumSlug,
		);

		this.illustrationService.moveIllustrationFolder(oldPath, newPath);
	}

	/**
	 * Move a release's illustrations folder
	 */
	reassignReleaseIllustration(
		releaseSlug: string,
		oldAlbumSlug: string,
		newAlbumSlug: string,
		oldArtistSlug?: string,
		newArtistSlug?: string,
	) {
		const oldPath = dirname(
			this.buildReleaseIllustrationPath(
				oldArtistSlug,
				oldAlbumSlug,
				releaseSlug,
			),
		);
		const newPath = dirname(
			this.buildReleaseIllustrationPath(
				newArtistSlug,
				newAlbumSlug,
				releaseSlug,
			),
		);

		this.illustrationService.moveIllustrationFolder(oldPath, newPath);
	}

	async downloadMissingArtistIllustrations() {
		const artistsWithoutIllustrations =
			await this.prismaService.artist.findMany({
				where: {
					illustration: null,
					externalIds: { some: { illustration: { not: null } } },
				},
				include: {
					externalIds: { where: { illustration: { not: null } } },
				},
			});

		await Promise.allSettled(
			artistsWithoutIllustrations.map(async (artist) => {
				for (const url of artist.externalIds
					.map(({ illustration }) => illustration)
					.filter((illustration) => illustration !== null)) {
					try {
						const buffer =
							await this.illustrationService.downloadIllustration(
								url!,
							);
						await this.createArtistIllustration(buffer, {
							id: artist.id,
						});
						this.logger.verbose(
							`Illustration found for artist '${artist.name}'`,
						);
						return;
					} catch {
						continue;
					}
				}
			}),
		);
	}
}
