import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsUUID } from "class-validator";

export class UpdateLabelDTO {
	@ApiProperty({ description: "MBID of the label" })
	@IsOptional()
	@IsUUID()
	mbid?: string;

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
		description: "The date of termination of the label",
	})
	@IsOptional()
	endDate?: Date;
}
