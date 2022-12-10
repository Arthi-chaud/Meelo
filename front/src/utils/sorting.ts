export const Orders = ['asc', 'desc'];

export type Order = typeof Orders[number];

export type SortingParameters<Keys extends string[]> = {
	sortBy: Keys[number];
	order?: Order;
}

const getOrderParams = (order: any) => {
	if (order?.toLowerCase() === 'desc') {
		return 'desc';
	}
	return 'asc';
};

const getSortingFieldParams = <T extends string[]>(field: any, availableKeys: readonly string[]): SortingParameters<T>['sortBy'] => {
	for (const key of availableKeys) {
		if (key.toString().toLowerCase() == field?.toLowerCase()) {
			return key;
		}
	}
	return availableKeys[0]!;
};

export { getOrderParams, getSortingFieldParams };
