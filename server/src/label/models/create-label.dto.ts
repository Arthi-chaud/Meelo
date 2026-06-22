import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export default class CreateLabelDTO {
	@ApiProperty({
		description: "The name of the label",
	})
	@IsString()
	@MinLength(1)
	name: string;

	@ApiProperty({
		description: "The MBID of the label",
	})
	@IsOptional()
	@IsUUID()
	mbid?: string;
}
