import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class ReassignReleaseDTO {
	@ApiProperty({
		description: 'The ID of the release to reassign'
	})
	@IsNotEmpty()
	releaseId: number;
	@ApiProperty({
		description: 'The ID of the album to reassign the release to'
	})
	@IsNotEmpty()
	albumId: number;
}