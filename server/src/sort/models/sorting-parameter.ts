import { ApiPropertyOptional } from "@nestjs/swagger";
import SortingOrder, { availableSortingOrders } from "./sorting-order";
import { IsIn, IsOptional } from "class-validator";

class SortingParameter<Keys extends readonly string[]> {
	@ApiPropertyOptional({
		type: "string",
		default: "id",
	})
	@IsOptional()
	sortBy: Keys[number];

	@ApiPropertyOptional({
		enum: availableSortingOrders,
		default: "asc",
	})
	order: SortingOrder;
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
		sortBy: SortingKeys[number] = "id";

		@ApiPropertyOptional({
			description: "The Order of the results",
			enum: availableSortingOrders,
			default: "asc",
		})
		@IsIn(availableSortingOrders)
		@IsOptional()
		order: SortingOrder = "asc";
	}
	return CustomSortingParameter;
};

export { ModelSortingParameter };
