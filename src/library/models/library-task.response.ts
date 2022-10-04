import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class LibraryTaskResponse {
	@ApiProperty({
		description: 'A message telling is the task has started or not'
	})
	@IsNotEmpty()
	status: string;
}