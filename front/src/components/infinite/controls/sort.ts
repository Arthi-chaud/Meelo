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

import type { ParsedUrlQuery } from "node:querystring";
import { useRouter } from "next/router";
import { useState } from "react";
import type { TranslationKey } from "../../../i18n/i18n";
import { parseQueryParam, setQueryParam } from "../../../utils/query-param";
import { type Order, Orders } from "../../../utils/sorting";

export type SortControl<SortingKey extends string> = {
	formatItem: (k: SortingKey) => TranslationKey;
	// returns the label of the menu + icon
	buttonLabel: TranslationKey;
	sortingKeys: readonly SortingKey[];
	selected: { sort: SortingKey; order: Order };
	onUpdate: (p: { sort: SortingKey; order: Order }) => void;
};

// Hook to get Sorting data to pass to Controls
export const useSortControl = <SortingKey extends TranslationKey>({
	sortingKeys,
}: {
	sortingKeys: readonly SortingKey[];
}) => {
	const router = useRouter();
	const orderQuery = getOrderQuery(router);
	const sortQuery = getSortQuery(router, sortingKeys);
	// Note: getSortQuery does not return  null,
	// falling back on the first key in the key list
	const [sortState, setSortState] = useState(() => ({
		sort: sortQuery,
		order: orderQuery ?? "asc",
	}));
	const control: SortControl<SortingKey> = {
		sortingKeys: sortingKeys,
		selected: sortState,
		buttonLabel: sortState.sort,
		formatItem: (t) => t,
		onUpdate: (p) => {
			setQueryParam(
				[
					["sort", p.sort],
					["order", p.order],
				],
				router,
			);
			setSortState(p);
		},
	};
	return [sortState, control] as const;
};

export const getOrderQuery = (router: { query: ParsedUrlQuery }) =>
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	parseQueryParam(router.query["order"], Orders);

export const getSortQuery = <SortKey extends string>(
	router: { query: ParsedUrlQuery },
	sortingKeys: readonly SortKey[],
) =>
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	parseQueryParam(router.query["sort"], sortingKeys) ?? sortingKeys[0];
