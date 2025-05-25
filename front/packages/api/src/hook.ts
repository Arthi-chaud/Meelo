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

import type { PaginationParameters } from "@/models/pagination";
import type Resource from "@/models/resource";
import { store } from "@/state/store";
import { accessTokenAtom } from "@/state/user";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import {
	useInfiniteQuery as useReactInfiniteQuery,
	useQueries as useReactQueries,
	useQuery as useReactQuery,
	useQueryClient as useReactQueryClient,
} from "react-query";
import API from ".";
import {
	type InfiniteQueryFn,
	type QueryFn,
	toTanStackInfiniteQuery,
	toTanStackQuery,
} from "./query";

const isSSR = () => typeof window === "undefined";

const apiInstancesAtom = atom({} as Record<string, API>);

export const useAPI = () => {
	const [accessToken] = useAtom(accessTokenAtom);
	const [apiInstances, setApiInstances] = useAtom(apiInstancesAtom);
	if (!accessToken) {
		return getAPI_(null);
	}
	const matchingInstance = apiInstances[accessToken];
	if (!matchingInstance) {
		const newInstance = getAPI_(accessToken);
		setApiInstances((rest) => ({ ...rest, [accessToken]: newInstance }));
		return newInstance;
	}
	return matchingInstance;
};

// Get API instance using atom to resolve access token
export const getAPI = () => {
	const accessToken = store.get(accessTokenAtom);
	return getAPI_(accessToken ?? null);
};

export const getAPI_ = (accessToken: string | null) => {
	const isDev = process.env.NODE_ENV === "development";
	const apiSSRUrl =
		process.env.SSR_SERVER_URL ?? process.env.PUBLIC_SERVER_URL!;

	const api = new API(accessToken, {
		illustration: isDev
			? "/api"
			: (process.env.PUBLIC_SERVER_URL ?? "/api"),
		api: isSSR()
			? apiSSRUrl
			: isDev
				? "/api"
				: (process.env.PUBLIC_SERVER_URL ?? "/api"),

		scanner: isSSR()
			? (process.env.SSR_SCANNER_URL ?? process.env.PUBLIC_SCANNER_URL!)
			: isDev
				? "/scanner"
				: (process.env.PUBLIC_SCANNER_URL ?? "/scanner"),
	});
	return api;
};

/**
 * Wrapper for the react-query's *useQuery*
 */
export const useQuery = <
	ReturnType,
	Params extends any[],
	Transformed = ReturnType,
>(
	query: QueryFn<ReturnType, Transformed, Params>,
	...queryParams: Partial<Params>
) => {
	const api = useAPI();
	const queryOpts = useMemo(
		() => toTanStackQuery(api, query, ...queryParams),
		[query, queryParams],
	);
	const hook = useReactQuery(queryOpts);

	useEffect(() => {
		if (queryOpts.enabled) {
			hook.refetch();
		}
	}, [api]);
	return hook;
};

/**
 * Wrapper for the react-query's *useQueries*
 */
export const useQueries = <ReturnType, Params extends any[][]>(
	...queries: readonly Parameters<
		typeof useQuery<ReturnType, Params[number], ReturnType>
	>[]
) => {
	const api = useAPI();
	const queryOpts = useMemo(
		() =>
			queries.map(([query, ...params]) =>
				toTanStackQuery(api, query, ...(params as Params[number])),
			),
		[queries],
	);
	const hook = useReactQueries(queryOpts);

	useEffect(() => {
		queryOpts.forEach((queryOpt, idx) => {
			if (queryOpt.enabled) {
				hook[idx].refetch();
			}
		});
	}, [api]);
	return hook;
};

/**
 * Wrapper for the react-query's *useInfiniteQuery*
 */
export const useInfiniteQuery = <
	ReturnType extends Resource,
	Params extends any[],
	TransformedType = ReturnType,
>(
	query: InfiniteQueryFn<ReturnType, TransformedType, Params>,
	...queryParams: Partial<Params>
) => {
	const api = useAPI();
	const queryOpts = useMemo(
		() => toTanStackInfiniteQuery(api, query, ...queryParams),
		[query, queryParams],
	);
	const { data, ...rest } = useReactInfiniteQuery({
		...queryOpts,
		getNextPageParam: (lastPage): PaginationParameters | null => {
			if (lastPage.metadata.next === null) {
				return null;
			}
			const lastItemId = lastPage.items.at(-1)?.id;
			if (lastItemId) {
				return { afterId: lastItemId };
			}
			return null;
		},
	});
	const [items, setItems] = useState(data?.pages.at(0)?.items);
	useEffect(() => {
		setItems(data?.pages.flatMap((p) => p.items));
	}, [data?.pages]);
	// useEffect(() => {
	// 	if (queryOpts.enabled) {
	// 		rest.refetch();
	// 	}
	// }, [api]);

	return { ...rest, data, items };
};

/**
 * Wrapper of the useQueryClient Hook, to wrap `toTanStackQuery`
 */
export const useQueryClient = () => {
	const api = useAPI();
	const queryClient = useReactQueryClient();

	return {
		api: api,
		client: queryClient,
		fetchQuery: <R, R1, Params extends any[]>(
			query: ReturnType<QueryFn<R, R1, Params>>,
		) => queryClient.fetchQuery(toTanStackQuery(api, () => query)),
	};
};

export type QueryClient = ReturnType<typeof useQueryClient>;
