import parseQueryParam from "./parse-query-param";

export const Orders = ['asc', 'desc'];

export type Order = typeof Orders[number];

export type SortingParameters<Keys extends string[]> = {
	sortBy: Keys[number];
	order?: Order;
}

const getOrderParams = (order: any) => parseQueryParam(order, Orders);

const getSortingFieldParams = <T extends string[]>(field: any, availableKeys: readonly string[]): SortingParameters<T>['sortBy'] => {
	return parseQueryParam(field, availableKeys);
};

export { getOrderParams, getSortingFieldParams };
