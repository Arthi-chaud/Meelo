import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class ReassignTrackDTO {
	@ApiProperty({
		description: 'The ID of the track to reassign'
	})
	@IsNotEmpty()
	trackId: number;
	@ApiProperty({
		description: 'The ID of the song to reassign the track to'
	})
	@IsNotEmpty()
	songId: number;
}