import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class ReassignAlbumDTO {
	@ApiProperty({
		description: 'The ID of the album to reassign',
		example: 123
	})
	@IsNotEmpty()
	albumId: number;
	@ApiProperty({
		description: 'The ID of the artist to reassign the album to',
		example: 123
	})
	artistId: number | null;
}