import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class UpdateLabelDTO {
	@ApiProperty({ description: "ID of the area to link" })
	@IsOptional()
	@IsNumber()
	areaId?: number;
}
