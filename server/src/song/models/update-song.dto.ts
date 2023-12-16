import { ApiProperty } from "@nestjs/swagger";
import { SongType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export default class UpdateSongDTO {
	@ApiProperty({
		description: "The type of the song",
		enum: SongType,
	})
	@IsEnum(SongType)
	@IsOptional()
	type?: SongType;
}
