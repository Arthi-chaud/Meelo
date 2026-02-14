"use client";
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

import {
	useInfiniteQuery as useReactInfiniteQuery,
	useQueries as useReactQueries,
	useQuery as useReactQuery,
	useQueryClient as useReactQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type Resource from "@/models/resource";
import type API from ".";
import {
	type InfiniteQueryFn,
	type QueryFn,
	toTanStackInfiniteQuery,
	toTanStackQuery,
} from "./query";

export const mkUseQuery = <
	ReturnType,
	Params extends any[],
	Transformed = ReturnType,
>(
	getAPIHook: () => API,
	query: QueryFn<ReturnType, Transformed, Params>,
	...queryParams: Partial<Params>
) => {
	const api = getAPIHook();
	const queryOpts = useMemo(
		() => toTanStackQuery(api, query, ...queryParams),
		[query, queryParams],
	);
	const hook = useReactQuery(queryOpts);

	return hook;
};

type QueryList<ReturnType, Params extends any[][]> = [
	query: QueryFn<ReturnType, ReturnType, Params[number]>,
	...params: Params[number],
][];

export const mkUseQueries = <ReturnType, Params extends any[][]>(
	getAPIHook: () => API,
	...queries: QueryList<ReturnType, Params>
) => {
	const api = getAPIHook();
	const queryOpts = useMemo(
		() =>
			queries.map(([query, ...params]) =>
				toTanStackQuery(api, query, ...params),
			),
		[queries],
	);
	const hook = useReactQueries({ queries: queryOpts });

	return hook;
};

export const mkUseInfiniteQuery = <
	ReturnType extends Resource,
	Params extends any[],
	TransformedType = ReturnType,
>(
	getAPIHook: () => API,
	query: InfiniteQueryFn<ReturnType, TransformedType, Params>,
	...queryParams: Partial<Params>
) => {
	const api = getAPIHook();
	const queryOpts = useMemo(
		() => toTanStackInfiniteQuery(api, query, ...queryParams),
		[query, queryParams],
	);
	const res = useReactInfiniteQuery(queryOpts);
	//TODO Check it does not break web
	const items = useMemo(
		() => res.data?.pages.flatMap(({ items }) => items),
		[res.data?.pages],
	);

	return { ...res, items };
};

/**
 * Wrapper of the useQueryClient Hook, to wrap `toTanStackQuery`
 */
export const mkUseQueryClient = (getAPIHook: () => API) => {
	const api = getAPIHook();
	const queryClient = useReactQueryClient();

	return {
		api: api,
		client: queryClient,
		fetchQuery: <R, R1, Params extends any[]>(
			query: ReturnType<QueryFn<R, R1, Params>>,
		) => queryClient.fetchQuery(toTanStackQuery(api, () => query)),
	};
};

export type QueryClient = ReturnType<typeof mkUseQueryClient>;
