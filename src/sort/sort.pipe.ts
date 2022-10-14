import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import type SortingOrder from "./models/sorting-order";
import { availableSortingOrders } from "./models/sorting-order";
import type SortingParameter from "./models/sorting-parameter";
import { InvalidSortingFieldException, InvalidSortingOrderException, MissingSortingFieldException } from "./sort.exceptions";

export default class ParseSortParameterPipe<Keys extends readonly string[], T extends SortingParameter<Keys>> implements PipeTransform {
	constructor(private readonly keys: Keys) { }
	transform(value: any, _metadata: ArgumentMetadata): T {
		const sortingParameters: T = <T>{};
		if (value.sortBy == undefined && value.order == undefined)
			return sortingParameters;
		const requestedOrder: SortingOrder = value.order ?? 'asc';
		const requestSortField: string = value.sortBy;
		if (requestSortField == undefined || requestSortField.length == 0)
			throw new MissingSortingFieldException(this.keys);
		if (!availableSortingOrders.includes(requestedOrder))
			throw new InvalidSortingOrderException(availableSortingOrders);
		if (!this.keys.includes(requestSortField))
			throw new InvalidSortingFieldException(this.keys);
		sortingParameters.sortBy = requestSortField;
		sortingParameters.order = requestedOrder;
		return sortingParameters;
	}
}