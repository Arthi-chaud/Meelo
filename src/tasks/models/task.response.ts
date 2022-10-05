import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class TaskResponse {
	@ApiProperty({
		description: 'A message about the status of the task'
	})
	@IsNotEmpty()
	status: string;
}