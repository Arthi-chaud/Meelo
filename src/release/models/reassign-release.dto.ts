import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class ReassignReleaseDTO {
	@ApiProperty({
		description: 'The ID of the release to reassign',
		example: 123
	})
	@IsNotEmpty()
	releaseId: number;
	@ApiProperty({
		description: 'The ID of the album to reassign the release to',
		example: 124
	})
	@IsNotEmpty()
	albumId: number;
}