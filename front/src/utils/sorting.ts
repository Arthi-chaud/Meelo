/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
