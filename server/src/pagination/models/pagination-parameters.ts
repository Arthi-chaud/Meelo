import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsPositive } from "class-validator";

/**
 * Default number of elements to take
 */
export const defaultPageSize = 20;

export class PaginationParameters {
	@ApiPropertyOptional({
		description: 'Number of items to skip',
		default: 0
	})
	@IsPositive()
	@IsOptional()
	skip?: number;

	@ApiProperty({
		required: false,
		description: `Specifies the number of elements to return`,
		default: defaultPageSize
	})
	@IsPositive()
	@IsOptional()
	take?: number;
}

export function buildPaginationParameters(parameters?: PaginationParameters) {
	return parameters ?? {};
}
