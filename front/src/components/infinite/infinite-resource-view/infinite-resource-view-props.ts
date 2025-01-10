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

import { MeeloInfiniteQueryFn } from "../../../api/use-query";
import Resource from "../../../models/resource";
import { LayoutOption } from "../../../utils/layout";
import { Order } from "../../../utils/sorting";
import { OptionState } from "../../controls/controls";

type InfiniteResourceViewProps<
	ResourceType extends Resource,
	SortingKeys extends readonly string[],
	AdditionalQueryParams extends object = object,
> = {
	query: (
		options: OptionState<SortingKeys> & AdditionalQueryParams,
	) => ReturnType<MeeloInfiniteQueryFn<ResourceType>>;
	light?: boolean;
	onItemClick?: (item: ResourceType) => void;
	disableSorting?: true;
	defaultLayout?: LayoutOption;
	initialSortingOrder?: Order;
	initialSortingField?: SortingKeys[number];
};

export default InfiniteResourceViewProps;
