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

import { Injectable } from "@nestjs/common";
import MetadataDto from "./models/metadata.dto";
import MetadataService from "src/registration/metadata.service";
import SettingsService from "src/settings/settings.service";
import LibraryService from "src/library/library.service";
import { Illustration, IllustrationType, Library } from "@prisma/client";
import { LibraryNotFoundException } from "src/library/library.exceptions";
import FileService from "src/file/file.service";
import * as path from "path";
import {
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import MetadataSavedResponse from "./models/metadata-saved.dto";
import escapeRegex from "src/utils/escape-regex";
import { HousekeepingService } from "src/housekeeping/housekeeping.service";
import FileQueryParameters from "src/file/models/file.query-parameters";
import TrackService from "src/track/track.service";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import IllustrationRepository from "src/illustration/illustration.repository";
import IllustrationService from "src/illustration/illustration.service";
import Logger from "src/logger/logger";

@Injectable()
export class RegistrationService {
	private readonly logger = new Logger(RegistrationService.name);
	constructor(
		private metadataService: MetadataService,
		private settingsService: SettingsService,
		private libraryService: LibraryService,
		private fileService: FileService,
		private trackService: TrackService,
		private illustrationService: IllustrationService,
		private illustrationRepository: IllustrationRepository,
		private housekeepingService: HousekeepingService,
	) {}

	async registerMetadata(m: MetadataDto): Promise<MetadataSavedResponse> {
		const parentLibrary = await this.resolveLibraryFromFilePath(m.path);
		if (!parentLibrary) {
			throw new LibraryNotFoundException(m.path);
		}
		const relativeFilePath = this.toRelativePath(m.path, parentLibrary);
		const fileEntry = await this.fileService.create({
			libraryId: parentLibrary.id,
			checksum: m.checksum,
			registerDate: m.registrationDate,
			path: relativeFilePath,
		});
		try {
			const createdTrack = await this.metadataService.registerMetadata(
				m,
				fileEntry,
			);
			return {
				trackId: createdTrack.id,
				sourceFileId: fileEntry.id,
				libraryId: parentLibrary.id,
				songId: createdTrack.songId,
				releaseId: createdTrack.releaseId,
			};
		} catch (e) {
			await this.fileService.delete({ id: fileEntry.id });
			throw e;
		}
	}

	async updateMetadata(m: MetadataDto): Promise<MetadataSavedResponse> {
		const parentLibrary = await this.resolveLibraryFromFilePath(m.path);
		if (!parentLibrary) {
			throw new LibraryNotFoundException(m.path);
		}
		const relativeFilePath = this.toRelativePath(m.path, parentLibrary);
		const fileEntry = await this.fileService.get({
			byPath: {
				library: {
					id: parentLibrary.id,
				},
				path: relativeFilePath,
			},
		});
		const createdTrack = await this.metadataService.registerMetadata(
			m,
			fileEntry,
			true,
		);
		await this.fileService.update(
			{ id: fileEntry.id },
			{ checksum: m.checksum, registerDate: m.registrationDate },
		);
		await this.housekeepingService.runHousekeeping();
		return {
			trackId: createdTrack.id,
			sourceFileId: fileEntry.id,
			libraryId: parentLibrary.id,
			songId: createdTrack.songId,
			releaseId: createdTrack.releaseId,
		};
	}

	public async unregisterFile(
		where: FileQueryParameters.DeleteInput,
		housekeeping = false,
	) {
		await this.trackService
			.delete({ sourceFileId: where.id })
			.catch((error) => {
				if (!(error instanceof NotFoundException)) {
					throw error;
				}
			});
		await this.fileService.delete(where);
		if (housekeeping) {
			await this.housekeepingService.runHousekeeping();
		}
	}
	/**
	 * Extract the illustration embedded into/in the same folder as the source file
	 * Then creates illustration item in DB (according to the type (release, disc, or track))
	 * @returns the path of the saved file
	 */
	async registerTrackIllustration(
		where: TrackQueryParameters.WhereInput,
		illustrationBytes: Buffer,
		type: IllustrationType = IllustrationType.Cover,
	): Promise<Illustration> {
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
		if (type == IllustrationType.Thumbnail) {
			return this.illustrationRepository.saveReleaseIllustration(
				illustrationBytes,
				track.discIndex,
				track.trackIndex,
				{
					id: track.releaseId,
				},
				type,
			);
		}
		const parentReleaseIllustrations =
			await this.illustrationRepository.getReleaseIllustrations({
				id: track.releaseId,
			});
		const parentDiscIllustration = parentReleaseIllustrations.find(
			(i) => i.disc === track.discIndex,
		);
		// If there is no illustration at all for the release or there is none for the current disc
		if (parentReleaseIllustrations.length == 0 || !parentDiscIllustration) {
			logRegistration(null, null);
			const newIllustration =
				await this.illustrationRepository.saveReleaseIllustration(
					illustrationBytes,
					track.discIndex,
					null,
					{
						id: track.releaseId,
					},
					type,
				);
			return newIllustration;
		}
		const hash = await this.illustrationService.getImageHash(
			illustrationBytes,
		);
		if (hash === parentDiscIllustration.hash) {
			// The scanned illustration is the disc's one
			return parentDiscIllustration.illustration;
		}
		logRegistration(track.discIndex, track.trackIndex);
		// If the track's disc's illustration is NOT the scanned one, save the scanned one as track specific
		return this.illustrationRepository.saveReleaseIllustration(
			illustrationBytes,
			track.discIndex,
			track.trackIndex,
			{
				id: track.releaseId,
			},
			type,
			undefined,
			hash,
		);
	}

	private async resolveLibraryFromFilePath(absoluteFilePath: string) {
		if (
			absoluteFilePath.includes("/../") ||
			absoluteFilePath.startsWith("../") ||
			!absoluteFilePath.startsWith(
				this.settingsService.settingsValues.dataFolder,
			)
		) {
			throw new InvalidRequestException(
				"File path is not absolute or is not in an allowed folder",
			);
		}
		if (
			!absoluteFilePath.startsWith(
				this.settingsService.settingsValues.dataFolder,
			)
		) {
			return null;
		}
		let filePath = path.normalize(
			absoluteFilePath.replace(
				escapeRegex(this.settingsService.settingsValues.dataFolder),
				"",
			),
		);
		if (filePath.startsWith("/")) {
			filePath = filePath.slice(1);
		}
		const allLibraries = await this.libraryService.getMany({});
		const matchingLibrary = allLibraries.find((l) =>
			filePath.startsWith(path.normalize(`${l.path}/`)),
		);
		return matchingLibrary ?? null;
	}
	private toRelativePath(fullFilePath: string, parentLibrary: Library) {
		return fullFilePath.slice(
			path.normalize(
				path.join(
					this.settingsService.settingsValues.dataFolder,
					"/",
					parentLibrary.path,
					"/",
				),
			).length,
		);
	}
}
