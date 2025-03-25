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

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { TranslationKey } from "../../../i18n/i18n";
import { parseQueryParam, setQueryParam } from "../../../utils/query-param";
import { type Order, Orders } from "../../../utils/sorting";

export type SortControl<SortingKey extends string> = {
	formatItem: (k: SortingKey) => TranslationKey;
	// returns the label of the menu + icon
	buttonLabel: TranslationKey;
	sortingKeys: SortingKey[];
	selected: { sort: SortingKey; order: Order };
	onUpdate: (p: { sort: SortingKey; order: Order }) => void;
};

// Hook to get Sorting data to pass to Controls
export const useSortControl = <SortingKey extends TranslationKey>({
	defaultSortingKey,
	sortingKeys,
}: {
	defaultSortingKey: SortingKey;
	sortingKeys: SortingKey[];
}) => {
	// // TODO Check layout update does not trigger infinite loop
	const router = useRouter();
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	const orderQuery = parseQueryParam(router.query["order"], Orders);
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	const sortQuery = parseQueryParam(router.query["sort"], sortingKeys);
	const [sortState, setSortState] = useState({
		sort: sortQuery ?? defaultSortingKey,
		order: orderQuery ?? "asc",
	});
	const control: SortControl<SortingKey> = {
		sortingKeys: sortingKeys,
		selected: sortState,
		buttonLabel: sortState.sort,
		formatItem: (t) => t,
		onUpdate: (p) => {
			setSortState(p);
		},
	};
	useEffect(() => {
		setQueryParam("order", sortState.order, router);
		setQueryParam("sort", sortState.sort, router);
	}, [sortState.sort, sortState.order]);
	return [sortState, setSortState, control] as const;
};
