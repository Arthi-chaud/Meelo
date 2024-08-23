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

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import LibraryService from "src/library/library.service";
import { Timeout } from "@nestjs/schedule";
import { Admin } from "src/authentication/roles/roles.decorators";
import IdentifierParam from "src/identifier/identifier.pipe";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import { TaskQueue } from "./tasks.runner";
import { Queue } from "bull";
import Tasks, { TasksDescription } from "./models/tasks";
import { InjectQueue } from "@nestjs/bull";
import {
	TaskQueueStatusResponse,
	TaskStatusResponse,
} from "./models/task.response";
import RefreshMetadataSelector from "./models/refresh-metadata.selector";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import Slug from "src/slug/slug";

@Admin()
@ApiTags("Tasks")
@Controller("tasks")
export default class TasksController {
	constructor(
		@InjectQueue(TaskQueue)
		private tasksQueue: Queue,
	) {}

	private onTaskAdded(): TaskStatusResponse {
		return {
			status: `Task added to queue`,
		};
	}

	@ApiOperation({
		summary: "Get running and pending tasks",
	})
	@Get()
	async getTaskQueueStatus(): Promise<TaskQueueStatusResponse> {
		const [activeJob, waitingJob] = await Promise.all([
			this.tasksQueue.getActive(0, 1).then((jobs) => jobs.at(0)),
			this.tasksQueue.getWaiting(),
		]);
		const response = new TaskQueueStatusResponse();

		response.active = activeJob
			? {
					name: activeJob.name,
					data: activeJob.data ?? null,
					description: TasksDescription[activeJob.name as Tasks],
			  }
			: null;
		response.pending = waitingJob.map((job) => ({
			name: job.name,
			description: TasksDescription[job.name as Tasks],
		}));
		return response;
	}

	@ApiOperation({
		summary: "Run houskeeping",
	})
	@Get("housekeeping")
	async housekeeping(): Promise<TaskStatusResponse> {
		await this.tasksQueue.add(Tasks.Housekeeping);
		return this.onTaskAdded();
	}

	@ApiOperation({
		summary: "Scan all libraries",
	})
	@Timeout(5000)
	@Get("scan")
	async scanLibrariesFiles(): Promise<TaskStatusResponse> {
		await this.tasksQueue.add(Tasks.Scan);
		return this.onTaskAdded();
	}

	@ApiOperation({
		summary: "Scan a library",
	})
	@Get("scan/:idOrSlug")
	async scanLibraryFiles(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	): Promise<TaskStatusResponse> {
		await this.tasksQueue.add(Tasks.ScanLibrary, where);
		return this.onTaskAdded();
	}

	@ApiOperation({
		summary: "Clean all libraries",
	})
	@Get("clean")
	async cleanLibraries(): Promise<TaskStatusResponse> {
		await this.tasksQueue.add(Tasks.Clean);
		return this.onTaskAdded();
	}

	@ApiOperation({
		summary: "Clean a library",
	})
	@Get("clean/:idOrSlug")
	async cleanLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	): Promise<TaskStatusResponse> {
		await this.tasksQueue.add(Tasks.CleanLibrary, where);
		return this.onTaskAdded();
	}

	@ApiOperation({
		summary: "Refresh files metadata, based on their relations",
	})
	@Get("refresh-metadata")
	async refreshLibrariesFilesMetadata(
		@Query() selector: RefreshMetadataSelector,
	): Promise<TaskStatusResponse> {
		if (Object.keys(selector).length == 0) {
			// In the case where no valid selector is given, the request is invalid
			throw new InvalidRequestException(
				"No source file selector was given. See documentation for more info.",
			);
		}
		await this.tasksQueue.add(
			Tasks.RefreshMetadata,
			JSON.stringify(selector, (__, value) => {
				if (value instanceof Slug) {
					return value.toString();
				}
				return value;
			}),
		);
		return this.onTaskAdded();
	}

	@ApiOperation({
		summary: "Fetch External Metadata from providers",
	})
	@Get("fetch-external-metadata")
	async fetchExternalMetadata(): Promise<TaskStatusResponse> {
		await this.tasksQueue.add(Tasks.FetchExternalMetadata);
		return this.onTaskAdded();
	}
}
