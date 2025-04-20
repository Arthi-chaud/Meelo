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

import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
	useInfiniteQuery as useReactInfiniteQuery,
	useQueries as useReactQueries,
	useQuery as useReactQuery,
	useQueryClient as useReactQueryClient,
} from "react-query";
import type Resource from "~/models/resource";
import { store } from "~/state/store";
import { accessTokenAtom } from "~/state/user";
import API from ".";
import {
	type InfiniteQueryFn,
	type QueryFn,
	toTanStackInfiniteQuery,
	toTanStackQuery,
} from "./query";

const apiInstancesAtom = atom({} as Record<string, API>);

export const useAPI = () => {
	const [accessToken] = useAtom(accessTokenAtom);
	const [apiInstances, setApiInstances] = useAtom(apiInstancesAtom);
	if (!accessToken) {
		return getAPI(null);
	}
	const matchingInstance = apiInstances[accessToken];
	if (!matchingInstance) {
		const newInstance = getAPI(accessToken);
		setApiInstances((rest) => ({ ...rest, [accessToken]: newInstance }));
		return newInstance;
	}
	return matchingInstance;
};

export const getSSRAPI = () => {
	const accessToken = store.get(accessTokenAtom);
	return getAPI(accessToken ?? null);
};

export const getAPI = (accessToken: string | null) => {
	const isDev = process.env.NODE_ENV === "development";
	const api = new API(
		accessToken,
		{
			api: {
				ssr:
					process.env.SSR_SERVER_URL ??
					process.env.PUBLIC_SERVER_URL!,
				csr: isDev ? "/api" : process.env.PUBLIC_SERVER_URL!,
			},
			scanner: {
				ssr:
					process.env.SSR_SCANNER_URL ??
					process.env.PUBLIC_SCANNER_URL!,
				csr: isDev ? "/scanner" : process.env.PUBLIC_SCANNER_URL!,
			},
		},
		isDev,
	);
	return api;
};

/**
 * Wrapper for the react-query's *useQuery*
 */
const useQuery = <ReturnType, Params extends any[], Transformed = ReturnType>(
	query: QueryFn<ReturnType, Transformed, Params>,
	...queryParams: Partial<Params>
) => {
	const api = useAPI();
	return useReactQuery(toTanStackQuery(api, query, ...queryParams));
};

/**
 * Wrapper for the react-query's *useQueries*
 */
export const useQueries = <ReturnType, Params extends any[][]>(
	...queries: Parameters<
		typeof useQuery<ReturnType, Params[number], ReturnType>
	>[]
) => {
	const api = useAPI();
	return useReactQueries(
		queries.map(([query, ...params]) =>
			toTanStackQuery(api, query, ...(params as Params[number])),
		),
	);
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
	const { data, ...res } = useReactInfiniteQuery({
		...toTanStackInfiniteQuery(api, query, ...queryParams),
		getNextPageParam: (lastPage) => {
			if (
				lastPage.metadata.next === null ||
				lastPage.items.length < api.pageSize
			) {
				return undefined;
			}
			return lastPage;
		},
	});
	const [items, setItems] = useState(data?.pages.at(0)?.items);
	useEffect(() => {
		setItems(data?.pages.flatMap((p) => p.items));
	}, [data?.pages]);

	return { ...res, data, items };
};

/**
 * Wrapper of the useQueryClient Hook, to wrap `prepareMeeloQuery`
 */
export const useQueryClient = () => {
	const api = useAPI();
	const queryClient = useReactQueryClient();

	return {
		client: queryClient,
		fetchQuery: <R, R1, Params extends any[]>(
			query: ReturnType<QueryFn<R, R1, Params>>,
		) => queryClient.fetchQuery(toTanStackQuery(api, () => query)),
	};
};

export type QueryClient = ReturnType<typeof useQueryClient>;
