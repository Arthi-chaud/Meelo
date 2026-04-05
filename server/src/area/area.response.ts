import { ApiProperty } from "@nestjs/swagger";
import { Area } from "src/prisma/models";

export class AreaResponse extends Area {}
export class ResponseWithArea {
	@ApiProperty({
		nullable: true,
		type: AreaResponse,
		description: "Use 'with' query parameter to include this field",
	})
	area?: AreaResponse | null | undefined;
}
