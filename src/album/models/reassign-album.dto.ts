import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { Album, Artist } from "src/prisma/models";

export default class ReassignAlbumDTO {
	@ApiProperty({
		description: 'The ID of the album to reassign',
		example: 123
	})
	@IsNotEmpty()
	albumId: Album['id'];

	@ApiProperty({
		description: 'The ID of the artist to reassign the album to',
		example: 123
	})
	artistId: Artist['id'] | null;
}
