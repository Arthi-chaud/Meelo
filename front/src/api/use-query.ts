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

/* eslint-disable no-restricted-imports */

import { useEffect, useState } from "react";
import {
	type QueryFunctionContext,
	useInfiniteQuery as useReactInfiniteQuery,
	useQueries as useReactQueries,
	useQuery as useReactQuery,
	useQueryClient as useReactQueryClient,
} from "react-query";
import type { InfiniteFetchFn, Page } from "~/components/infinite/scroll";
import type Resource from "~/models/resource";
import API from "./api";

type Key = string | number;

//// Query types

export type Query<Type> = {
	key: Key[];
	// @warning If you call this method 'by hand', please consider using a query client instead
	exec: () => Promise<Type>;
};

export type InfiniteQuery<Type> = {
	key: Key[];
	exec: InfiniteFetchFn<Type>;
};
//// Query functions

export type MeeloQueryFn<
	QueryReturnType = unknown,
	Params extends any[] = any[],
> = (...args: Params) => Query<QueryReturnType>;

export type MeeloInfiniteQueryFn<
	QueryReturnType = unknown,
	Params extends any[] = any[],
> = (...args: Params) => InfiniteQuery<QueryReturnType>;

export const DefaultMeeloQueryOptions = {
	useErrorBoundary: true,
	retry: 2,
	staleTime: 5 * (60 * 1000),
	cacheTime: 10 * (60 * 1000),
	refetchOnMount: true,
	// We want this in dev, not in prod to avoid useless refecthes.
	refetchOnWindowFocus: process.env.NODE_ENV !== "production",
	refetchOnReconnect: true,
};

/**
 * Wrapper for 'react-query''s useQuery's parameters, to manage dependent queries more easily
 * @param query the function that prepare the query
 * @param queryArgs the arguments to pass the the query function. If one of them is undefined, the query will not be enabled
 * @returns
 */
const prepareMeeloQuery = <
	QueryReturnType = unknown,
	Params extends any[] = unknown[],
>(
	query: MeeloQueryFn<QueryReturnType, Params>,
	...queryArgs: Partial<Params>
) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...(queryArgs as Parameters<typeof query>));

	return {
		queryKey: queryParams.key,
		queryFn: queryParams.exec,
		enabled: enabled,
		...DefaultMeeloQueryOptions,
	};
};

/**
 * Using the query parameters, defines if a query should be enabled or not
 * @param args
 * @returns
 */
const isEnabled = (args: any[]) => {
	return args.findIndex((elem) => elem === undefined || elem === null) === -1;
};

/**
 * Wrapper for 'react-query''s useInfiniteQuery's parameters, to manage dependent queries more easily
 * @param query the function that prepare the query
 * @param queryArgs the arguments to pass the the query function. If one of them is undefined, the query will not be enabled
 * @returns
 */
const prepareMeeloInfiniteQuery = <
	QueryReturnType extends Resource = Resource,
	Params extends any[] = unknown[],
>(
	query: MeeloInfiniteQueryFn<QueryReturnType, Params>,
	...queryArgs: Partial<Params>
) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...(queryArgs as Params));

	return {
		queryKey: queryParams.key,
		queryFn: (context: QueryFunctionContext) =>
			queryParams
				.exec(
					context.pageParam ?? {
						index: 0,
						pageSize: API.defaultPageSize,
					},
				)
				.then(
					(result): Page<QueryReturnType> => ({
						pageSize: result.items.length,
						items: result.items,
						afterId: result.items.at(-1)?.id ?? null,
						end: result.metadata.next === null,
					}),
				),
		enabled: enabled,
		...DefaultMeeloQueryOptions,
	};
};

/**
 * Wrapper for the react-query's *useQuery*
 */
const useQuery = <ReturnType, Params extends any[]>(
	query: MeeloQueryFn<ReturnType, Params>,
	...queryParams: Partial<Params>
) => {
	return useReactQuery(prepareMeeloQuery(query, ...queryParams));
};

/**
 * Wrapper for the react-query's *useQueries*
 */
const useQueries = <ReturnType, Params extends any[][]>(
	...queries: Parameters<typeof useQuery<ReturnType, Params[number]>>[]
) => {
	return useReactQueries(
		queries.map(([query, ...params]) =>
			prepareMeeloQuery(query, ...(params as Params[number])),
		),
	);
};

/**
 * Wrapper for the react-query's *useInfiniteQuery*
 */
const useInfiniteQuery = <ReturnType extends Resource, Params extends any[]>(
	query: MeeloInfiniteQueryFn<ReturnType, Params>,
	...queryParams: Partial<Params>
) => {
	const pageSize = API.defaultPageSize;
	const { data, ...res } = useReactInfiniteQuery({
		...prepareMeeloInfiniteQuery(query, ...queryParams),
		getNextPageParam: (
			lastPage: Page<ReturnType>,
		): Page<ReturnType> | undefined => {
			if (lastPage.end || lastPage.items.length < pageSize) {
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
const useQueryClient = () => {
	const queryClient = useReactQueryClient();

	return {
		client: queryClient,
		fetchQuery: <R, Params extends any[]>(
			query: ReturnType<MeeloQueryFn<R, Params>>,
		) => queryClient.fetchQuery(prepareMeeloQuery(() => query)),
	};
};

export const toInfiniteQuery = <T>(q: Query<T[]>): InfiniteQuery<T> => {
	return {
		key: q.key,
		exec: () =>
			q.exec().then((res) => ({
				items: res,
				metadata: {
					next: null,
					page: 0,
					previous: null,
					this: "",
				},
			})),
	};
};

export const transformPage = <To, From>(
	q: InfiniteQuery<From>,
	transformer: (item: From, index: number) => To,
): InfiniteQuery<To> => {
	return {
		key: q.key,
		exec: (p) =>
			q.exec(p).then((res) => ({
				items: res.items.map(transformer),
				metadata: res.metadata,
			})),
	};
};

export type QueryClient = ReturnType<typeof useQueryClient>;

export {
	useQuery,
	useQueries,
	useInfiniteQuery,
	useQueryClient,
	prepareMeeloQuery,
	prepareMeeloInfiniteQuery,
};
