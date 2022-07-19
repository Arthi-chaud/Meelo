import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";


/**
 * Default number of elements to take
 */
export const defaultPageSize = 20;

export class PaginationParameters {
	@ApiPropertyOptional()
	skip?: number;
	@ApiProperty({
		required: false,
		description: `Implicit default value: ${defaultPageSize}`
	})
	take?: number;
};

export function buildPaginationParameters(parameters?: PaginationParameters) {
	return parameters ?? {}
};
