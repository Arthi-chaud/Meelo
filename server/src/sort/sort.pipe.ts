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

import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import SortingOrder, { availableSortingOrders } from "./models/sorting-order";
import type SortingParameter from "./models/sorting-parameter";
import {
	InvalidSortingFieldException,
	InvalidSortingOrderException,
	MissingSortingFieldException,
} from "./sort.exceptions";

export default class ParseSortParameterPipe<
	Keys extends readonly string[],
	T extends SortingParameter<Keys>,
> implements PipeTransform
{
	constructor(private readonly keys: Keys) {}
	transform(value: any, _metadata: ArgumentMetadata): T {
		const sortingParameters: T = <T>{};

		if (value.sortBy == undefined && value.order == undefined) {
			return sortingParameters;
		}
		const requestedOrder: SortingOrder = value.order ?? "asc";
		const requestSortField: string = value.sortBy;

		if (requestSortField == undefined || requestSortField.length == 0) {
			throw new MissingSortingFieldException(this.keys);
		}
		if (!availableSortingOrders.includes(requestedOrder)) {
			throw new InvalidSortingOrderException(availableSortingOrders);
		}
		if (!this.keys.includes(requestSortField)) {
			throw new InvalidSortingFieldException(this.keys);
		}
		sortingParameters.sortBy = requestSortField;
		sortingParameters.order = requestedOrder;
		return sortingParameters;
	}
}
