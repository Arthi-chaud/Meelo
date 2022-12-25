import { ApiPropertyOptional } from "@nestjs/swagger";
import SortingOrder, { availableSortingOrders } from "./sorting-order";

class SortingParameter<Keys extends readonly string[]> {
	@ApiPropertyOptional({
		type: 'string',
		default: 'id'
	})
	sortBy: Keys[number];

	@ApiPropertyOptional({
		enum: availableSortingOrders,
		default: 'asc'
	})
	order: SortingOrder;
}
export default SortingParameter;
