import { IsOptional, IsPositive } from 'class-validator';

/**
 * A DTO to request an illustration with special dimensions
 */
export class IllustrationDimensionsDto {
	@IsPositive({ message: () => "Illustration's width: Expected a strictly positive number" })
	@IsOptional()
	width?: number;
	@IsPositive({ message: () => "Illustration's height: Expected a strictly positive number" })
	@IsOptional()
	height?: number;
}