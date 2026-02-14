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
import { Orders, type SortingParameters } from "@/models/sorting";
import type { ViewPreference } from "@/state/view-preference";
import { getViewPreference, useViewPreference } from "~/state/view-preferences";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

export const ssrGetSortingParameter = <SortingKey extends string>(
	sortingKeys: readonly SortingKey[],
	router: {
		query: ParsedUrlQuery;
		pathname: string;
	},
	defaultValue?: SortingParameters<SortingKey[]>,
) => {
	return getSortingParameter(
		sortingKeys,
		router,
		getViewPreference(router.pathname),
		defaultValue,
	);
};

// Using the view preference atom and the query parameters, identifies what the SortingParamaters should be
const getSortingParameter = <SortingKey extends string>(
	sortingKeys: readonly SortingKey[],
	router: {
		query: ParsedUrlQuery;
	},
	viewPreference: ViewPreference,
	defaultValue?: SortingParameters<SortingKey[]>,
) => {
	const order =
		getOrderQuery(router) ??
		parseQueryParam(viewPreference?.sort?.order, Orders) ??
		defaultValue?.order ??
		"asc";
	const sortBy =
		getSortQuery(router, sortingKeys) ??
		parseQueryParam(viewPreference?.sort?.sortBy, sortingKeys) ??
		defaultValue?.sortBy ??
		sortingKeys[0];
	return { sortBy, order };
	// NOTE: Do not change the order of the fields, for SSR and query key match
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
	const [, setViewPreference] = useViewPreference(router.route);
	return useSortControlBase({
		hook: () => {
			const router = useRouter();
			const [viewPreference] = useViewPreference(router.route);
			const { order, sortBy } = getSortingParameter(
				sortingKeys,
				router,
				viewPreference,
				{ order: "asc", sortBy: sortingKeys[0] },
			);
			return { sort: sortBy, order };
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

export const getSortQuery = <SortKey extends string>(
	router: { query: ParsedUrlQuery },
	sortingKeys: readonly SortKey[],
) =>
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	parseQueryParam(router.query["sort"], sortingKeys);
