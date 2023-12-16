import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";
import { Song } from "src/prisma/models";

export default class ReassignTrackDTO {
	@ApiProperty({
		description: "The ID of the song to reassign the track to",
		example: 2,
	})
	@IsNumber()
	songId: Song["id"];
}
