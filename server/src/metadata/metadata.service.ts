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
import ScannerService from "src/scanner/scanner.service";
import SettingsService from "src/settings/settings.service";
import LibraryService from "src/library/library.service";
import { Library } from "@prisma/client";
import { LibraryNotFoundException } from "src/library/library.exceptions";
import FileService from "src/file/file.service";
import * as path from "path";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import MetadataSavedResponse from "./models/metadata-saved.dto";

@Injectable()
export class MetadataService {
	// TODO: one microservice is ready, move everything from scanner module to metadata
	constructor(
		private scannerService: ScannerService,
		private settingsService: SettingsService,
		private libraryService: LibraryService,
		private fileService: FileService,
	) {}
	async saveMetadata(m: MetadataDto): Promise<MetadataSavedResponse> {
		if (
			m.path.includes("/../") ||
			m.path.startsWith("../") ||
			!m.path.startsWith(this.settingsService.settingsValues.dataFolder)
		) {
			throw new InvalidRequestException(
				"File path is not absolute or is not in an allowed folder",
			);
		}
		const parentLibrary = await this.resolveLibraryFromFilePath(m.path);
		if (!parentLibrary) {
			throw new LibraryNotFoundException(m.path);
		}
		const relativeFilePath = this.toRelativePath(m.path, parentLibrary);
		const fileEntry = await this.fileService.create({
			libraryId: parentLibrary.id,
			md5Checksum: m.checksum,
			registerDate: m.registrationDate,
			path: relativeFilePath,
		});
		try {
			const createdTrack = await this.scannerService.registerMetadata(
				m,
				fileEntry,
			);
			if (m.illustration) {
				//todo illustration
			}
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

	private async resolveLibraryFromFilePath(absoluteFilePath: string) {
		if (
			!absoluteFilePath.startsWith(
				this.settingsService.settingsValues.dataFolder,
			)
		) {
			return null;
		}
		const filePath = path.normalize(
			absoluteFilePath.slice(
				this.settingsService.settingsValues.dataFolder.length,
			),
		);
		const allLibraries = await this.libraryService.getMany({});
		const matchingLibrary = allLibraries.find((l) =>
			filePath.startsWith(path.normalize(`${l.path}/`)),
		);
		return matchingLibrary ?? null;
	}
	private toRelativePath(fullFilePath: string, parentLibrary: Library) {
		return fullFilePath.slice(
			path.normalize(this.settingsService.settingsValues.dataFolder)
				.length + path.normalize(parentLibrary.path).length,
		);
	}
}
