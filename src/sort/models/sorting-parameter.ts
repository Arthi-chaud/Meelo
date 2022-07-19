import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type SortingOrder from "./sorting-order";


class SortingParameter<Keys extends string[]> {
	@ApiProperty()
	sortBy: Keys[number];
	@ApiPropertyOptional()
	order?: SortingOrder
}
export default SortingParameter;

export function buildSortingParameter<Keys extends string[]>(sortingParameters?: SortingParameter<Keys>) {
	if (sortingParameters == undefined)
		return {};
	return {
		[sortingParameters.sortBy]: sortingParameters.order
	}
}