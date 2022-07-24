import { ApiPropertyOptional } from "@nestjs/swagger";
import type SortingOrder from "./sorting-order";
import { availableSortingOrders } from "./sorting-order";


class SortingParameter<Keys extends string[]> {
	@ApiPropertyOptional({
		type: 'string'
	})
	sortBy: Keys[number];
	@ApiPropertyOptional({
		enum: availableSortingOrders
	})
	order?: SortingOrder
}
export default SortingParameter;

export function buildSortingParameter<Keys extends string[]>(sortingParameters?: SortingParameter<Keys>) {
	if (sortingParameters?.sortBy === undefined)
		return {};
	return {
		[sortingParameters.sortBy]: sortingParameters.order ?? 'asc',
	}
}