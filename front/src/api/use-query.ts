/* eslint-disable no-restricted-imports */
import {
	QueryFunctionContext,
	useInfiniteQuery as useReactInfiniteQuery,
	useQueries as useReactQueries,
	useQuery as useReactQuery
} from "react-query";
import API from "./api";
import { InfiniteFetchFn } from "../components/infinite/infinite-scroll";

type Key = string | number | Record<string, unknown>;

//// Query types

export type Query<Type> = {
	key: Key[],
	exec: () => Promise<Type>
};

export type InfiniteQuery<Type> = {
	key: Key[],
	exec: InfiniteFetchFn<Type>
}
//// Query functions

export type MeeloQueryFn<
	QueryReturnType = unknown
> = (...args: any[]) => Query<QueryReturnType>

export type MeeloInfiniteQueryFn<
	QueryReturnType,
> = (...args: any[]) => InfiniteQuery<QueryReturnType>

const defaultMeeloQueryOptions = {
	useErrorBoundary: true,
	retry: 1
};

/**
 * Wrapper for 'react-query''s useQuery's parameters, to manage dependent queries more easily
 * @param query the function that prepare the query
 * @param queryArgs the arguments to pass the the query function. If one of them is undefined, the query will not be enabled
 * @returns
 */
const prepareMeeloQuery = <QueryReturnType = unknown>(
	query: MeeloQueryFn<QueryReturnType>,
	...queryArgs: Partial<Parameters<typeof query>>
) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...queryArgs as Parameters<typeof query>);

	return {
		queryKey: queryParams.key,
		queryFn: queryParams.exec,
		enabled: enabled,
		...defaultMeeloQueryOptions
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
const prepareMeeloInfiniteQuery = <QueryReturnType = unknown>(
	query: MeeloInfiniteQueryFn<QueryReturnType>,
	...queryArgs: Partial<Parameters<typeof query>>
) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...queryArgs as Parameters<typeof query>);

	return {
		queryKey: queryParams.key,
		queryFn: (context: QueryFunctionContext) =>
			queryParams.exec(context.pageParam ?? { index: 0, pageSize: API.defaultPageSize })
				.then((result) => ({
					pageSize: result.items.length,
					items: result.items,
					index: result.metadata.page,
					end: result.metadata.next === null
				})),
		enabled: enabled,
		...defaultMeeloQueryOptions
	};
};

/**
 * Wrapper for the react-query's *useQuery*
 */
const useQuery = <ReturnType>(
	query: MeeloQueryFn<ReturnType>,
	...queryParams: Partial<Parameters<typeof query>>
) => {
	return useReactQuery(prepareMeeloQuery(query, ...queryParams));
};

/**
 * Wrapper for the react-query's *useQueries*
 */
const useQueries = <ReturnType>(
	...queries: Parameters<typeof useQuery<ReturnType>>[]
) => {
	return useReactQueries(
		queries.map(([query, ...params]) => prepareMeeloQuery(query, ...params))
	);
};

/**
 * Wrapper for the react-query's *useInfiniteQuery*
 */
const useInfiniteQuery = <ReturnType>(
	query: MeeloInfiniteQueryFn<ReturnType>,
	...queryParams: Partial<Parameters<typeof query>>
) => {
	return useReactInfiniteQuery(prepareMeeloInfiniteQuery(query, ...queryParams));
};

export { useQuery, useQueries, useInfiniteQuery, prepareMeeloQuery, prepareMeeloInfiniteQuery };
