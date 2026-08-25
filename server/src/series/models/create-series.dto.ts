import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export default class CreateSeriesDTO {
	@ApiProperty({
		description: "The name of the series",
	})
	@IsString()
	@MinLength(1)
	name: string;

	@ApiProperty({
		description: "The MBID of the series",
	})
	@IsOptional()
	@IsUUID()
	mbid?: string;
}
