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

import { ApiProperty } from "@nestjs/swagger";

export default class TaskResponse {
	@ApiProperty({
		description: "Name of the task",
	})
	name: string;

	@ApiProperty({
		description: "Description of the task",
	})
	description: string;
}

export class TaskStatusResponse {
	@ApiProperty({
		description: "A message about the status of the task",
	})
	status: string;
}

export class ActiveTaskResponse extends TaskResponse {
	@ApiProperty({
		description: "JSON Parameter of the task",
		type: JSON,
		nullable: true,
	})
	data: JSON | null;
}

export class TaskQueueStatusResponse {
	@ApiProperty({
		type: ActiveTaskResponse,
		description: "Current running task",
		nullable: true,
	})
	active: ActiveTaskResponse | null;

	@ApiProperty({
		type: TaskResponse,
		description: "Tasks waiting to be processed",
		isArray: true,
	})
	pending: TaskResponse[];
}
