import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, ValidateIf } from "class-validator";

export class UpdateLabelDTO {
	@ApiProperty({ description: "ID of the area to link" })
	@IsOptional()
	@IsNumber()
	@ValidateIf((_, value) => value !== null)
	areaId?: number;

	@ApiProperty({
		description: "The date of creation of the label",
	})
	@IsOptional()
	@IsDate()
	@ValidateIf((_, value) => value !== null)
	startDate?: Date | null;

	@ApiProperty({
		description: "The date of creation of the label",
	})
	@IsOptional()
	@IsDate()
	@ValidateIf((_, value) => value !== null)
	endDate?: Date | null;
}
