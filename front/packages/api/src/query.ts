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

import type { InfiniteData, QueryFunctionContext } from "@tanstack/react-query";
import type PaginatedResponse from "@/models/pagination";
import type { PaginationParameters } from "@/models/pagination";
import type Resource from "@/models/resource";
import type API from ".";

type Key = string | number | Key[];

//// Query types

export type Query<Type, Transformed = Type> = {
	key: Key[];
	exec: (api: API) => () => Promise<Type>;
	transformer?: (t: Type) => Transformed;
};

export type InfiniteQuery<Type, Transformed = Type> = {
	key: Key[];
	exec: (
		api: API,
	) => (pagination: PaginationParameters) => Promise<PaginatedResponse<Type>>;
	transformer?: (t: Type, index: number) => Transformed;
};

export type InfiniteFetchFn<T> = (
	pagination: PaginationParameters,
) => Promise<PaginatedResponse<T>>;

//// Query functions

export type QueryFn<
	QueryReturnType = unknown,
	TransformedReturnType = QueryReturnType,
	Params extends any[] = any[],
> = (...args: Params) => Query<QueryReturnType, TransformedReturnType>;

export type InfiniteQueryFn<
	QueryReturnType = unknown,
	TransformedReturnType = QueryReturnType,
	Params extends any[] = any[],
> = (...args: Params) => InfiniteQuery<QueryReturnType, TransformedReturnType>;

export const DefaultQueryOptions = {
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
export const toTanStackQuery = <
	QueryReturnType = unknown,
	TransformedReturnType = QueryReturnType,
	Params extends any[] = unknown[],
>(
	api: API,
	query: QueryFn<QueryReturnType, TransformedReturnType, Params>,
	...queryArgs: Partial<Params>
) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...(queryArgs as Parameters<typeof query>));

	return {
		queryKey: queryParams.key,
		queryFn: queryParams.exec(api),
		enabled: enabled,
		select: queryParams.transformer,
		...DefaultQueryOptions,
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
export const toTanStackInfiniteQuery = <
	QueryReturnType extends Resource = Resource,
	TransformedReturnType = QueryReturnType,
	Params extends any[] = unknown[],
>(
	api: API,
	query: InfiniteQueryFn<QueryReturnType, TransformedReturnType, Params>,
	...queryArgs: Partial<Params>
) => {
	const enabled = isEnabled(queryArgs);
	const { key, exec, transformer } = query(...(queryArgs as Params));

	return {
		queryKey: key,
		queryFn: (context: QueryFunctionContext<Key[], PaginationParameters>) =>
			exec(api)(context.pageParam),
		select: (result: InfiniteData<PaginatedResponse<QueryReturnType>>) => {
			return transformer
				? {
						//TODO I am worried about this, performance wise
						//I dont want the map to be applied to all elements at every new page
						pageParams: result.pageParams,
						pages: result.pages.map(({ items, ...rest }) => ({
							...rest,
							items: items.map(transformer),
						})),
					}
				: (result as unknown as InfiniteData<
						PaginatedResponse<TransformedReturnType>
					>);
		},

		getNextPageParam: (
			lastPage: PaginatedResponse<QueryReturnType>,
		): PaginationParameters | null => {
			if (lastPage.metadata.next === null) {
				return null;
			}
			const lastItemId = lastPage.items.at(-1)?.id;
			if (lastItemId) {
				return { afterId: lastItemId };
			}
			return null;
		},
		initialPageParam: {},
		enabled: enabled,
		...DefaultQueryOptions,
	};
};

export const toInfiniteQuery = <T>(q: Query<T[]>): InfiniteQuery<T> => {
	return {
		key: [...q.key, "paged"],
		exec: (api) => () =>
			q
				.exec(api)()
				.then((res) => ({
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

export const transformPage = <To, From, From1 = From>(
	q: InfiniteQuery<From, From1>,
	transformer: (item: From1, index: number) => To,
): InfiniteQuery<From, To> => {
	return {
		key: q.key,
		exec: q.exec,
		transformer: (item, index) =>
			q.transformer
				? transformer(q.transformer(item, index), index)
				: // From1 cannot be distinct from From if there is no transformer
					transformer(item as unknown as From1, index),
	};
};
