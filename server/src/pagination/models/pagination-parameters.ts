/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsPositive } from "class-validator";

/**
 * Default number of elements to take
 */
export const defaultPageSize = 20;

export class PaginationParameters {
	@ApiProperty({
		required: false,
		description: `The ID of the last item in the previous 'page'`,
	})
	@IsPositive()
	@IsOptional()
	afterId?: number;

	@ApiPropertyOptional({
		description: "Number of items to skip",
	})
	@IsPositive()
	@IsOptional()
	skip?: number;

	@ApiProperty({
		required: false,
		description: "Specifies the number of elements to return",
		default: defaultPageSize,
	})
	@IsPositive()
	@IsOptional()
	take?: number = defaultPageSize;
}
