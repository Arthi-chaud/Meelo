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
import { useSortControl as useSortControlBase } from "@/infinite-controls/sort";
import { Orders } from "@/models/sorting";
import { useViewPreference } from "~/state/view-preferences";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

// Hook to get Sorting data to pass to Controls
export const useSortControl = <SortingKey extends string>({
	sortingKeys,
	translate,
}: {
	sortingKeys: readonly SortingKey[];
	translate: (s: SortingKey) => TranslationKey;
}) => {
	const router = useRouter();
	const [, setViewPreference] = useViewPreference(router.route);
	return useSortControlBase({
		hook: () => {
			const router = useRouter();
			const [viewPreference] = useViewPreference(router.route);
			const order =
				getOrderQuery(router) ??
				parseQueryParam(viewPreference?.sort?.order, Orders) ??
				"asc";
			const sort =
				getSortQuery_(router, sortingKeys) ??
				parseQueryParam(viewPreference?.sort?.sortBy, sortingKeys) ??
				sortingKeys[0];
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
			setViewPreference((vp) => {
				vp.sort = { sortBy: p.sort, order: p.order };
				return vp;
			});
		},
	});
};

export const getOrderQuery = (router: { query: ParsedUrlQuery }) =>
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	parseQueryParam(router.query["order"], Orders);

const getSortQuery_ = <SortKey extends string>(
	router: { query: ParsedUrlQuery },
	sortingKeys: readonly SortKey[],
) =>
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	parseQueryParam(router.query["sort"], sortingKeys);

export const getSortQuery = <SortKey extends string>(
	router: { query: ParsedUrlQuery },
	sortingKeys: readonly SortKey[],
) => getSortQuery_(router, sortingKeys) ?? sortingKeys[0];
