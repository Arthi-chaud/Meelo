import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsPositive } from "class-validator";

/**
 * Default number of elements to take
 */
export const defaultPageSize = 20;

export class PaginationParameters {
	@ApiProperty({
		required: false,
		description: `The ID of the last item in the previous 'page'`
	})
	@IsPositive()
	@IsOptional()
	afterId?: number;

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
	return {
		take: parameters?.take,
		skip: parameters?.afterId !== undefined
			? 1
			: parameters?.skip,
		cursor: parameters?.afterId !== undefined ? {
			id: parameters.afterId
		} : undefined
	};
}
