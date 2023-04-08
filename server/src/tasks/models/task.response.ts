import { ApiProperty } from "@nestjs/swagger";

export default class TaskResponse {
	@ApiProperty({
		description: 'Name of the task'
	})
	name: string;

	@ApiProperty({
		description: 'Description of the task'
	})
	description: string;
}

export class TaskStatusResponse {
	@ApiProperty({
		description: 'A message about the status of the task'
	})
	status: string;
}

export class ActiveTaskResponse extends TaskResponse {
	@ApiProperty({
		description: 'JSON Parameter of the task'
	})
	data: JSON;
}

export class TaskQueueStatusResponse {
	@ApiProperty({
		type: ActiveTaskResponse,
		description: 'Current running task',
		nullable: true
	})
	active: ActiveTaskResponse | null;

	@ApiProperty({
		type: TaskResponse,
		description: 'Tasks waiting to be processed',
		isArray: true
	})
	waiting: TaskResponse[];
}
