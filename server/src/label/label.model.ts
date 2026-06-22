import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class UpdateLabelDTO {
	@ApiProperty({ description: "ID of the area to link" })
	@IsOptional()
	@IsNumber()
	areaId?: number;

	@ApiProperty({
		description: "The date of creation of the label",
	})
	@IsOptional()
	startDate?: Date;

	@ApiProperty({
		description: "The date of creation of the label",
	})
	@IsOptional()
	endDate?: Date;
}
