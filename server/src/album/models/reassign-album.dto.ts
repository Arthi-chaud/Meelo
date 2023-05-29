import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, ValidateIf } from "class-validator";
import { Album, Artist } from "src/prisma/models";

export default class ReassignAlbumDTO {
	@ApiProperty({
		description: 'The ID of the album to reassign',
		example: 123
	})
	@IsNotEmpty()
	@IsNumber()
	albumId: Album['id'];

	@ApiProperty({
		description: 'The ID of the artist to reassign the album to',
		example: 123
	})
	@IsNumber()
	@ValidateIf((__, value) => value !== null)
	artistId: Artist['id'] | null;
}
