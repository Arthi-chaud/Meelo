import { InvalidRequestException } from "src/exceptions/meelo-exception";

export class MissingSortingFieldException extends InvalidRequestException {
	constructor(availableKeys: readonly string[]) {
		super(`Sorting: Missing 'sortBy' parameter. Available values are: [${availableKeys}].`);
	}
}

export class InvalidSortingFieldException extends InvalidRequestException {
	constructor(availableKeys: readonly string[]) {
		super(`Sorting: Invalid 'sortBy' parameter. Available values are: [${availableKeys}].`);
	}
}

export class InvalidSortingOrderException extends InvalidRequestException {
	constructor(availableOrders: readonly string[]) {
		super(`Sorting: Invalid 'order' parameter. Available values are: [${availableOrders}].`);
	}
}