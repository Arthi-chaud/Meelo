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

import { join } from "node:path";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IllustrationType } from "src/prisma/generated/client";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type ProviderQueryParameters from "src/external-metadata/models/provider.query-parameters";
import ProviderService from "src/external-metadata/provider.service";
import Logger from "src/logger/logger";
import type PlaylistQueryParameters from "src/playlist/models/playlist.query-parameters";
import { UnallowedPlaylistUpdate } from "src/playlist/playlist.exceptions";
import PlaylistService from "src/playlist/playlist.service";
import type { Illustration } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import SettingsService from "src/settings/settings.service";
import type TrackQueryParameters from "src/track/models/track.query-parameters";
import TrackService from "src/track/track.service";
import {
	IllustrationNotFoundException,
	MissingIllustrationResourceIdException,
} from "./illustration.exceptions";
import IllustrationService from "./illustration.service";
import { IllustrationResponse } from "./models/illustration.response";
import type { IllustrationDownloadDto } from "./models/illustration-dl.dto";
import type IllustrationStats from "./models/illustration-stats";

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
		@Inject(forwardRef(() => SettingsService))
		private settingsService: SettingsService,
		private providerService: ProviderService,
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

	async saveIllustrationFromUrl(
		dto: IllustrationDownloadDto,
		userId: number | null, // Can be null if we want to save anything but a playlist's image
	): Promise<IllustrationResponse> {
		const resourceKeys = Object.keys(dto).filter((k) => k !== "url");
		if (resourceKeys.length !== 1) {
			throw new MissingIllustrationResourceIdException();
		}
		const resourceKey = resourceKeys[0] as keyof IllustrationDownloadDto;

		const buffer = await this.illustrationService.downloadIllustration(
			dto.url,
		);
		switch (resourceKey) {
			case "url": // Note: to please typeckechecker
			case "artistId": {
				return this.saveArtistIllustration(buffer, {
					id: dto[resourceKey]! as number,
				}).then(IllustrationResponse.from);
			}
			case "playlistId": {
				return this.savePlaylistIllustration(
					buffer,
					{
						id: dto[resourceKey]!,
					},
					userId!,
				).then(IllustrationResponse.from);
			}
			case "trackId": {
				const track = await this.trackService.get({
					id: dto[resourceKey]!,
				});

				if (!track.releaseId) {
					return this.saveTrackStandaloneIllustration(buffer, {
						id: track.id,
					}).then(IllustrationResponse.from);
				}
				return this.saveReleaseIllustration(
					buffer,
					track.discIndex,
					track.trackIndex,
					{ id: track.releaseId },
					IllustrationType.Cover,
				).then(IllustrationResponse.from);
			}
			case "releaseId": {
				return this.saveReleaseIllustration(
					buffer,
					null,
					null,
					{
						id: dto[resourceKey]!,
					},
					IllustrationType.Cover,
				).then(IllustrationResponse.from);
			}
		}
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
		userId: number,
	): Promise<Illustration> {
		const playlist = await this.playlistService.get(where, userId);
		if (playlist.ownerId !== userId) {
			throw new UnallowedPlaylistUpdate(playlist.id);
		}
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

	async saveProviderIcon(
		buffer: Buffer,
		where: ProviderQueryParameters.WhereInput,
	): Promise<Illustration> {
		const provider = await this.providerService.get(where);
		if (provider.illustrationId !== null) {
			await this.deleteIllustration(provider.illustrationId);
		}
		const newIllustration = await this.saveIllustration(
			buffer,
			IllustrationType.Icon,
		);

		await this.prismaService.provider.update({
			data: { illustrationId: newIllustration.id },
			where: { id: provider.id },
		});
		return newIllustration;
	}

	async saveTrackThumbnail(
		buffer: Buffer,
		where: TrackQueryParameters.WhereInput,
	) {
		const track = await this.trackService.get(where);
		const newIllustration = await this.saveIllustration(
			buffer,
			IllustrationType.Thumbnail,
		);
		if (track.thumbnailId) {
			await this.deleteIllustration(track.thumbnailId);
		}
		await this.trackService.update(
			{ thumbnailId: newIllustration.id },
			where,
		);
		return newIllustration;
	}

	async saveTrackStandaloneIllustration(
		buffer: Buffer,
		where: TrackQueryParameters.WhereInput,
		type: IllustrationType = IllustrationType.Cover,
	) {
		const track = await this.trackService.get(where);
		const newIllustration = await this.saveIllustration(buffer, type);
		if (track.standaloneIllustrationId) {
			await this.deleteIllustration(track.standaloneIllustrationId);
		}
		await this.trackService.update(
			{ standaloneIllustrationId: newIllustration.id },
			where,
		);
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

	/**
	 * Deletes Illustration (File + info in DB)
	 */
	async deleteIllustration(illustrationId: number) {
		const illustration = await this.prismaService.illustration.findFirst({
			where: { id: illustrationId },
		});
		if (!illustration) {
			return;
		}
		const illustrationDir = this.buildIllustrationDirPath(illustration.id);

		this.illustrationService.deleteIllustrationFolder(illustrationDir);
		return this.prismaService.illustration
			.delete({
				where: { id: illustrationId },
			})
			.catch(() => {});
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
}
