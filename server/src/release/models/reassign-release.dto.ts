import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";
import { Album, Release } from "src/prisma/models";

export default class ReassignReleaseDTO {
	@ApiProperty({
		description: 'The ID of the release to reassign',
		example: 123
	})
	@IsNumber()
	releaseId: Release['id'];

	@ApiProperty({
		description: 'The ID of the album to reassign the release to',
		example: 124
	})
	@IsNumber()
	albumId: Album['id'];
}
