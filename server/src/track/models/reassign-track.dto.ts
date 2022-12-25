import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { Song, Track } from "src/prisma/models";

export default class ReassignTrackDTO {
	@ApiProperty({
		description: 'The ID of the track to reassign',
		example: 1
	})
	@IsNotEmpty()
	trackId: Track['id'];

	@ApiProperty({
		description: 'The ID of the song to reassign the track to',
		example: 2
	})
	@IsNotEmpty()
	songId: Song['id'];
}
