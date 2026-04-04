import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { AreaType } from "src/prisma/generated/enums";
import { CreateArea } from "src/prisma/models";

export default class CreateAreaDTO extends OmitType(CreateArea, [
	"sortSlug",
	"slug",
	"type",
]) {
	@ApiProperty({
		enum: AreaType,
	})
	@IsEnum(AreaType)
	@IsOptional()
	@Transform(({ value }) => {
		if (!(value in AreaType)) {
			return null;
		}
		return value;
	})
	type?: AreaType;
}
