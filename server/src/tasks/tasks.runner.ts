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

import { Inject, forwardRef } from "@nestjs/common";
import Logger from "src/logger/logger";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import ExternalIdService from "src/providers/external-id.provider";
import { LyricsService } from "src/lyrics/lyrics.service";
import IllustrationRepository from "src/illustration/illustration.repository";
import Task from "./models/tasks";

export const TaskQueue = "task-queue";

export default class TaskRunner {
	private readonly logger = new Logger(TaskRunner.name);
	private _runningTask: Task | null = null;
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => ExternalIdService))
		private externalIdService: ExternalIdService,
		private lyricsService: LyricsService,
	) {}

	public get runningTask(): Task | null {
		return this._runningTask;
	}

	public async fetchExternalMetadata(): Promise<void> {
		if (this._runningTask) {
			throw new InvalidRequestException("A task is already running");
		}
		this._runningTask = Task.FetchExternalMetadata;
		this.fetchExternalMetadataTask().then(() => {
			this._runningTask = null;
		});
	}

	private async fetchExternalMetadataTask() {
		await this.fetchExternalIds().catch(() => {});
		await this.fetchExternalIllustrations().catch(() => {});
		await this.lyricsService.fetchMissingLyrics().catch(() => {});
	}

	/**
	 * Fetch Missing External IDs for artists, songs and albums
	 */
	private async fetchExternalIds(): Promise<void> {
		this.logger.log(`Fetching external identifiers for artists started.`);
		await this.externalIdService.fetchArtistsExternalIds().catch(() => {});
		this.logger.log(`Fetching external identifiers for albums started.`);
		await this.externalIdService.fetchAlbumsExternalIds().catch(() => {});
		this.logger.log(`Fetching external identifiers for songs started.`);
		await this.externalIdService.fetchSongsExternalIds().catch(() => {});
		this.logger.log(`Fetching external identifiers for finished.`);
	}

	/**
	 * Fetch Missing External Illustrations from providers
	 */
	private fetchExternalIllustrations(): Promise<void> {
		return this.illustrationRepository.downloadMissingArtistIllustrations();
	}
}
