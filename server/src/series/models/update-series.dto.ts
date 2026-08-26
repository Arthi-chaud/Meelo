import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class UpdateSeriesDTO {
	@ApiProperty({ description: "MBID of the series" })
	@IsOptional()
	@IsUUID()
	mbid?: string;
}
