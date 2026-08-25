import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsUUID } from "class-validator";

export class UpdateSeriesDTO {
	@ApiProperty({ description: "MBID of the series" })
	@IsOptional()
	@IsUUID()
	mbid?: string;

	@ApiProperty({ description: "ID of the label to link" })
	@IsOptional()
	@IsNumber()
	labelId?: number;
}
