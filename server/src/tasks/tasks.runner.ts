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

import Task from "./models/tasks";
import { OnQueueError, Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { HttpStatus, Inject, forwardRef } from "@nestjs/common";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type { File } from "src/prisma/models";
import FileManagerService from "src/file-manager/file-manager.service";
import type FileQueryParameters from "src/file/models/file.query-parameters";
import TrackService from "src/track/track.service";
import FileService from "src/file/file.service";
import ScannerService from "src/registration/metadata.service";
import LibraryService from "src/library/library.service";
import Logger from "src/logger/logger";
import SettingsService from "src/settings/settings.service";
import {
	MeeloException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import ExternalIdService from "src/providers/external-id.provider";
import { LyricsService } from "src/lyrics/lyrics.service";
import IllustrationRepository from "src/illustration/illustration.repository";
import { HousekeepingService } from "src/housekeeping/housekeeping.service";

export const TaskQueue = "task-queue";

@Processor(TaskQueue)
export default class TaskRunner {
	private readonly logger = new Logger(TaskRunner.name);
	constructor(
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService,
		private housekeepingService: HousekeepingService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => ScannerService))
		private registrationService: ScannerService,
		@Inject(forwardRef(() => LibraryService))
		private libraryService: LibraryService,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ExternalIdService))
		private externalIdService: ExternalIdService,
		private lyricsService: LyricsService,
	) {}

	@OnQueueError()
	onError(err: Error) {
		throw new MeeloException(HttpStatus.INTERNAL_SERVER_ERROR, err.message);
	}

	@Process("*")
	async processTask(job: Job<any>) {
		const taskName = job.name as Task;

		switch (taskName) {
			case Task.FetchExternalMetadata:
				return this.runTask(job, () => this.fetchExternalMetadata());
		}
		await job.moveToFailed({ message: "Unknown Task" });
	}

	private async runTask<T>(
		job: Job<T>,
		task: (payload: T) => Promise<void>,
	): Promise<void> {
		this.logger.log(`Task '${job.name}' started`);
		try {
			await task(job.data);
			this.logger.log(`Task '${job.name}' completed`);
		} catch (err) {
			this.logger.error(`Task '${job.name}' failed: ${err.message}`);
			await job.moveToFailed({ message: err.message });
		}
	}

	private async fetchExternalMetadata(): Promise<void> {
		await this.fetchExternalIds();
		await this.fetchExternalIllustrations();
		await this.lyricsService.fetchMissingLyrics();
	}

	/**
	 * Fetch Missing External IDs for artists, songs and albums
	 */
	private async fetchExternalIds(): Promise<void> {
		this.logger.log(`Fetching external identifiers for artists started.`);
		await this.externalIdService.fetchArtistsExternalIds();
		this.logger.log(`Fetching external identifiers for albums started.`);
		await this.externalIdService.fetchAlbumsExternalIds();
		this.logger.log(`Fetching external identifiers for songs started.`);
		await this.externalIdService.fetchSongsExternalIds();
		this.logger.log(`Fetching external identifiers for finished.`);
	}

	/**
	 * Fetch Missing External Illustrations from providers
	 */
	private fetchExternalIllustrations(): Promise<void> {
		return this.illustrationRepository.downloadMissingArtistIllustrations();
	}
}
