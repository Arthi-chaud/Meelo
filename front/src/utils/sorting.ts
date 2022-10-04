import Resource from "../models/resource";

export type SortingParameters<T> = {
	sortBy: keyof T;
	order?: 'asc' | 'desc';
}

const getOrderParams = (order: any): SortingParameters<Resource>['order'] => {
	if (order?.toLowerCase() === 'desc')
		return 'desc';
	return 'asc';
}

const getSortingFieldParams = <T extends Resource>(field: any, availableKeys: (keyof T)[]): SortingParameters<T>['sortBy'] => {
	for (const key of availableKeys) {
		if (key.toString().toLowerCase() == field?.toLowerCase())
			return key;
	}
	return availableKeys[0]!;
}

export { getOrderParams, getSortingFieldParams };