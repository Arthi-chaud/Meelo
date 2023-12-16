import parseQueryParam from "./parse-query-param";

export const Orders = ["asc", "desc"] as const;

export type Order = (typeof Orders)[number];

export type SortingParameters<Keys extends readonly string[]> = {
	sortBy: Keys[number];
	order?: Order;
};

const getOrderParams = (order: any) => parseQueryParam(order, Orders);

const getSortingFieldParams = <Keys extends readonly string[]>(
	field: any,
	availableKeys: Keys,
): Keys[number] => {
	return parseQueryParam(field, availableKeys) ?? availableKeys[0];
};

export { getOrderParams, getSortingFieldParams };
