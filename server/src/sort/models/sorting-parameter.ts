import { ApiPropertyOptional } from "@nestjs/swagger";
import SortingOrder, { availableSortingOrders } from "./sorting-order";
import { IsIn, IsOptional } from "class-validator";

class SortingParameter<Keys extends readonly string[]> {
	@ApiPropertyOptional({
		type: 'string',
		default: 'id'
	})
	@IsOptional()
	sortBy: Keys[number];

	@ApiPropertyOptional({
		enum: availableSortingOrders,
		default: 'asc'
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
const ModelSortingParameter = <
	SortingKeys extends readonly string[]
>(sortingKeys: SortingKeys) => {
	class CustomSortingParameter {
		@ApiPropertyOptional({
			type: 'string',
			default: 'id'
		})
		@IsOptional()
		@IsIn(sortingKeys)
		sortBy: SortingKeys[number];

		@ApiPropertyOptional({
			enum: availableSortingOrders,
			default: 'asc'
		})
		@IsIn(availableSortingOrders)
		@IsOptional()
		order: SortingOrder;
	}
	return CustomSortingParameter;
};

export { ModelSortingParameter };
