import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, ValidateIf } from "class-validator";
import { Artist } from "src/prisma/models";

export default class ReassignAlbumDTO {
	@ApiProperty({
		description: 'The ID of the artist to reassign the album to',
		example: 123
	})
	@IsNumber()
	@ValidateIf((__, value) => value !== null)
	artistId: Artist['id'] | null;
}
