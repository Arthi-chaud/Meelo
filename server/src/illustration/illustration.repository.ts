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
import { Illustration } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import IllustrationService from "./illustration.service";
import SettingsService from "src/settings/settings.service";
import { join } from "path";
import Logger from "src/logger/logger";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import TrackService from "src/track/track.service";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import SongQueryParameters from "src/song/models/song.query-params";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import FfmpegService from "src/scanner/ffmpeg.service";
import PlaylistQueryParameters from "src/playlist/models/playlist.query-parameters";
import PlaylistService from "src/playlist/playlist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import ScannerService from "src/scanner/scanner.service";
import { IllustrationNotFoundException } from "./illustration.exceptions";
import { IllustrationType } from "@prisma/client";
import IllustrationStats from "./models/illustration-stats";

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
		private ffmpegService: FfmpegService,
		private scannerService: ScannerService,
		private fileManagerService: FileManagerService,
	) {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			"metadata",
		);
	}

	buildIllustrationDirPath(illustrationId: number) {
		return join(this.baseIllustrationFolderPath, illustrationId.toString());
	}
	buildIllustrationPath(illustrationId: number) {
		return join(
			this.buildIllustrationDirPath(illustrationId),
			this.illustrationFileName,
		);
	}

	/**
	 * Get the Illustration row
	 */
	async getIllustration(illustrationId: number): Promise<Illustration> {
		const illustration = await this.prismaService.illustration
			.findFirstOrThrow({
				where: { id: illustrationId },
			})
			.catch(() => {
				throw new IllustrationNotFoundException(illustrationId);
			});

		return illustration;
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
	): Promise<Illustration | null> {
		return this.prismaService.illustration.findFirst({
			where: {
				release: {
					release: ReleaseService.formatWhereInput(where),
					track: null, // We want to avoid track-specific illustrations
					...(disc === 1
						? { OR: [{ disc: null }, { disc: 1 }] }
						: { disc }),
				},
			},
			orderBy: { release: { disc: { nulls: "first", sort: "asc" } } },
		});
	}

	async getSongIllustration(where: SongQueryParameters.WhereInput) {
		return this.trackService
			.getMasterTrack(where)
			.then((track) => this.getTrackIllustration({ id: track.id }))
			.catch(() => null);
	}

	async getAlbumIllustration(
		where: AlbumQueryParameters.WhereInput,
	): Promise<Illustration | null> {
		return this.releaseService
			.getMasterRelease(where)
			.then((release) => this.getReleaseIllustration({ id: release.id }));
	}

	/**
	 * If the track does not have a specific illustration, fallback on parent disc, then release
	 */
	async getTrackIllustration(where: TrackQueryParameters.WhereInput) {
		const track = await this.trackService.get(where);

		return this.prismaService.illustration.findFirst({
			where: {
				release: {
					release: {
						id: track.releaseId,
					},
					OR: [
						{ disc: track.discIndex, track: track.trackIndex },
						{ disc: track.discIndex, track: null },
						{ disc: null, track: null },
					],
				},
			},
			orderBy: [
				{
					release: {
						disc: { nulls: "last", sort: "asc" },
					},
				},
				{
					release: {
						track: { nulls: "last", sort: "asc" },
					},
				},
			],
		});
	}

	async saveArtistIllustration(
		buffer: Buffer,
		where: ArtistQueryParameters.WhereInput,
	): Promise<Illustration> {
		const artist = await this.artistService.get(where);
		if (artist.illustrationId !== null) {
			await this.deleteIllustration(artist.illustrationId);
		}
		const newIllustration = await this.saveIllustration(
			buffer,
			IllustrationType.Avatar,
		);

		await this.prismaService.artist.update({
			data: { illustrationId: newIllustration.id },
			where: { id: artist.id },
		});
		return newIllustration;
	}

	async savePlaylistIllustration(
		buffer: Buffer,
		where: PlaylistQueryParameters.WhereInput,
	): Promise<Illustration> {
		const playlist = await this.playlistService.get(where);
		if (playlist.illustrationId !== null) {
			await this.deleteIllustration(playlist.illustrationId);
		}
		const newIllustration = await this.saveIllustration(
			buffer,
			IllustrationType.Cover,
		);

		await this.prismaService.playlist.update({
			data: { illustrationId: newIllustration.id },
			where: { id: playlist.id },
		});
		return newIllustration;
	}

	private async saveIllustration(
		buffer: Buffer,
		type: IllustrationType,
	): Promise<Illustration> {
		const { blurhash, colors, aspectRatio } =
			await this.illustrationService.getImageStats(buffer);

		const newIllustration = await this.prismaService.illustration.create({
			data: {
				blurhash,
				colors,
				aspectRatio,
				type,
			},
		});

		const illustrationPath = this.buildIllustrationPath(newIllustration.id);
		this.illustrationService.saveIllustration(buffer, illustrationPath);
		return newIllustration;
	}

	async saveReleaseIllustration(
		buffer: Buffer,
		disc: number | null,
		track: number | null,
		where: ReleaseQueryParameters.WhereInput,
		type: IllustrationType,
		imageStats?: IllustrationStats,
		hash?: string,
	): Promise<Illustration> {
		const releaseIllustrations = await this.getReleaseIllustrations(where);
		const previousIllustration = releaseIllustrations.find(
			(i) => i.disc === disc && i.track === track,
		);
		if (previousIllustration) {
			await this.deleteIllustration(previousIllustration.illustration.id);
		}
		hash ??= await this.illustrationService.getImageHash(buffer);
		imageStats ??= await this.illustrationService.getImageStats(buffer);
		const release = await this.releaseService.get(where);
		const newIllustration = await this.prismaService.illustration.create({
			data: {
				...imageStats,
				type,
				release: {
					create: {
						hash,
						disc,
						track,
						releaseId: release.id,
					},
				},
			},
		});
		const illustrationPath = this.buildIllustrationPath(newIllustration.id);
		this.illustrationService.saveIllustration(buffer, illustrationPath);
		return newIllustration;
	}

	/**
	 * Deletes Illustration (File + info in DB)
	 */
	async deleteIllustration(illustrationId: number) {
		const illustration = await this.prismaService.illustration
			.findFirstOrThrow({
				where: { id: illustrationId },
			})
			.catch(() => {
				throw new IllustrationNotFoundException(illustrationId);
			});
		const illustrationDir = this.buildIllustrationDirPath(illustration.id);

		this.illustrationService.deleteIllustrationFolder(illustrationDir);
		return this.prismaService.illustration
			.delete({
				where: { id: illustrationId },
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
	): Promise<Illustration | null> {
		const extractedIllustration =
			await this.extractIllustrationBasedOnPreferences(sourceFilePath);

		if (extractedIllustration == null) {
			return null;
		}
		const track = await this.trackService.get(where, { release: true });
		const logRegistration = (
			disc: number | null,
			trackIndex: number | null,
		) =>
			this.logger.verbose(
				`Saving Illustration for '${track.release.name}' (Disc ${
					disc ?? 1
				}${trackIndex === null ? "" : `, track ${trackIndex}`}).`,
			);
		const parentReleaseIllustrations = await this.getReleaseIllustrations({
			id: track.releaseId,
		});
		const parentReleaseMainIllustration = parentReleaseIllustrations.find(
			(i) => i.disc === null && i.track === null,
		);
		const parentDiscIllustration = parentReleaseIllustrations.find(
			(i) => i.disc !== null && i.disc === track.discIndex,
		);
		const illustrationBytes = extractedIllustration;
		if (
			parentReleaseIllustrations.length == 0 ||
			parentReleaseMainIllustration === undefined
		) {
			logRegistration(null, null);
			const newIllustration = await this.saveReleaseIllustration(
				illustrationBytes,
				null,
				null,
				{
					id: track.releaseId,
				},
				IllustrationType.Cover,
			);
			return newIllustration;
		}
		const hash = await this.illustrationService.getImageHash(
			illustrationBytes,
		);
		if (hash === parentReleaseMainIllustration.hash) {
			// The scanned illustration is the release's main one
			return null;
		}
		if (!parentDiscIllustration) {
			logRegistration(track.discIndex, null);
			// If the track's disc does not have an illustration, save the scanned one
			return this.saveReleaseIllustration(
				illustrationBytes,
				track.discIndex,
				null,
				{
					id: track.releaseId,
				},
				IllustrationType.Cover,
				undefined,
				hash,
			);
		} else if (hash === parentDiscIllustration.hash) {
			return null;
		}
		logRegistration(track.discIndex, track.trackIndex);
		// If the track's disc's illustration is NOT the scanned one, save the scanned one as track specific
		return this.saveReleaseIllustration(
			illustrationBytes,
			track.discIndex,
			track.trackIndex,
			{
				id: track.releaseId,
			},
			IllustrationType.Cover,
			undefined,
			hash,
		);
	}

	private async extractIllustrationBasedOnPreferences(
		sourceFilePath: string,
	): Promise<Buffer | null> {
		const getEmbedded = () =>
			this.scannerService.extractIllustrationFromFile(sourceFilePath);
		const getInline = () =>
			this.scannerService.extractIllustrationInFileFolder(sourceFilePath);
		if (this.settingsService.settingsValues.metadata.order === "only") {
			if (
				this.settingsService.settingsValues.metadata.source ==
				"embedded"
			) {
				return getEmbedded();
			}
			return getInline();
		}
		const [prefered, fallback] =
			this.settingsService.settingsValues.metadata.source == "embedded"
				? [getEmbedded, getInline]
				: [getInline, getEmbedded];
		const resolvedFavorite = await prefered();

		if (resolvedFavorite == null) {
			return fallback();
		}
		return resolvedFavorite;
	}

	public async getReleaseIllustrations(
		where: ReleaseQueryParameters.WhereInput,
	) {
		return this.prismaService.releaseIllustration.findMany({
			where: {
				release: ReleaseService.formatWhereInput(where),
			},
			include: { illustration: true },
		});
	}

	async registerVideoTrackScreenshot(
		where: TrackQueryParameters.WhereInput,
		sourceFilePath: string,
	): Promise<Illustration | null> {
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
		return this.saveReleaseIllustration(
			await this.fileManagerService.getFileBuffer(tmpFilePath),
			track.discIndex,
			track.trackIndex,
			{ id: track.releaseId },
			IllustrationType.Thumbnail,
		).finally(() => {
			this.fileManagerService.deleteFile(tmpFilePath);
		});
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
						await this.saveArtistIllustration(buffer, {
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
