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

import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Admin } from "src/authentication/roles/roles.decorators";
import TaskRunner from "./tasks.runner";
import { TasksDescription } from "./models/tasks";
import {
	TaskQueueStatusResponse,
	TaskStatusResponse,
} from "./models/task.response";

@Admin()
@ApiTags("Tasks")
@Controller("tasks")
export default class TasksController {
	constructor(private taskRunner: TaskRunner) {}
	private onTaskAdded(): TaskStatusResponse {
		return {
			status: `Task started`,
		};
	}

	@ApiOperation({
		summary: "Get running tasks",
	})
	@Get()
	async getRunningTask(): Promise<TaskQueueStatusResponse> {
		const runningTask = this.taskRunner.runningTask;
		const response = new TaskQueueStatusResponse();

		response.active = runningTask
			? {
					name: runningTask,
					description: TasksDescription[runningTask],
			  }
			: null;
		return response;
	}

	@ApiOperation({
		summary: "Fetch External Metadata from providers",
	})
	@Get("fetch-external-metadata")
	async fetchExternalMetadata(): Promise<TaskStatusResponse> {
		await this.taskRunner.fetchExternalMetadata();
		return this.onTaskAdded();
	}
}
