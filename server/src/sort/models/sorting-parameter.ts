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

import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import type SortingOrder from "./sorting-order";
import { availableSortingOrders } from "./sorting-order";

class SortingParameter<Keys extends readonly string[]> {
	@ApiPropertyOptional({
		type: "string",
		default: "id",
	})
	@IsOptional()
	sortBy?: Keys[number];

	@ApiPropertyOptional({
		enum: availableSortingOrders,
		default: "asc",
	})
	order?: SortingOrder;
}
export default SortingParameter;

/**
 * Sorting Parameter Class Factory
 * This is mainly done for API documentation
 * @param sortingKeys the availalble sorting keys
 * @returns Sorting Parameter Class for Repository Service
 */
const ModelSortingParameter = <SortingKeys extends readonly string[]>(
	sortingKeys: SortingKeys,
) => {
	class CustomSortingParameter {
		@ApiPropertyOptional({
			description: "The Field used to sort the results",
			type: "string",
			default: "id",
			enum: sortingKeys,
		})
		@IsOptional()
		@IsIn(sortingKeys)
		sortBy?: SortingKeys[number];

		@ApiPropertyOptional({
			description: "The Order of the results",
			enum: availableSortingOrders,
			default: "asc",
		})
		@IsIn(availableSortingOrders)
		@IsOptional()
		order?: SortingOrder;
	}
	return CustomSortingParameter;
};

export { ModelSortingParameter };
