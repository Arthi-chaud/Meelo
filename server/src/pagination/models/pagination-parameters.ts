import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsPositive } from "class-validator";

/**
 * Default number of elements to take
 */
export const defaultPageSize = 20;

export class PaginationParameters {
	@ApiPropertyOptional()
	@IsPositive()
	@IsOptional()
	skip?: number;

	@ApiProperty({
		required: false,
		description: `Implicit default value: ${defaultPageSize}`
	})
	@IsPositive()
	@IsOptional()
	take?: number;
}

export function buildPaginationParameters(parameters?: PaginationParameters) {
	return parameters ?? {};
}
