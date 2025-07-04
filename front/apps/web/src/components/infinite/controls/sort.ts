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
import { useSortControl as useSortControlBase } from "@/infinite-controls/sort";
import { type Order, Orders } from "@/models/sorting";
import { useRouter } from "next/router";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

export type SortControl<SortingKey extends string> = {
	formatItem: (k: SortingKey) => TranslationKey;
	// returns the label of the menu + icon
	buttonLabel: TranslationKey;
	sortingKeys: readonly SortingKey[];
	selected: { sort: SortingKey; order: Order };
	onUpdate: (p: { sort: SortingKey; order: Order }) => void;
};

// Hook to get Sorting data to pass to Controls
export const useSortControl = <SortingKey extends string>({
	sortingKeys,
	translate,
}: {
	sortingKeys: readonly SortingKey[];
	translate: (s: SortingKey) => TranslationKey;
}) => {
	const router = useRouter();
	return useSortControlBase({
		hook: () => {
			const router = useRouter();
			const order = getOrderQuery(router) ?? "asc";
			const sort = getSortQuery(router, sortingKeys);
			// Note: getSortQuery does not return  null,
			// falling back on the first key in the key list
			return { sort, order };
		},
		sortingKeys,
		translate,
		onUpdate: (p) => {
			setQueryParam(
				[
					["sort", p.sort],
					["order", p.order],
				],
				router,
			);
		},
	});
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
