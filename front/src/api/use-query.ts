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
	Parameters extends any[],
	QueryReturnType = unknown
> = (...args: Parameters) => Query<QueryReturnType>

export type MeeloInfiniteQueryFn<
	QueryReturnType,
	Parameters extends any[],
> = (...args: Parameters[]) => InfiniteQuery<QueryReturnType>

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
const prepareMeeloQuery = <QueryFnParameters extends any[], QueryReturnType = unknown>(
	query: MeeloQueryFn<QueryFnParameters, QueryReturnType>,
	...queryArgs: Partial<QueryFnParameters>
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
const prepareMeeloInfiniteQuery = <QueryFnParameters extends unknown[], QueryReturnType = unknown>(
	query: MeeloInfiniteQueryFn<QueryReturnType, QueryFnParameters>,
	...queryArgs: Partial<QueryFnParameters>
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
const useQuery = <Params extends unknown[], ReturnType>(
	query: MeeloQueryFn<Params, ReturnType>,
	...queryParams: Partial<Params>
) => {
	return useReactQuery(prepareMeeloQuery(query, ...queryParams));
};

/**
 * Wrapper for the react-query's *useQueries*
 */
const useQueries = <Params extends unknown[], ReturnType>(
	...queries: Parameters<typeof useQuery<Params, ReturnType>>[]
) => {
	return useReactQueries(
		queries.map(([query, ...params]) => prepareMeeloQuery(query, ...params))
	);
};

/**
 * Wrapper for the react-query's *useInfiniteQuery*
 */
const useInfiniteQuery = <Params extends unknown[], ReturnType>(
	query: MeeloInfiniteQueryFn<ReturnType, Params>,
	...queryParams: Partial<Params>
) => {
	return useReactInfiniteQuery(prepareMeeloInfiniteQuery(query, ...queryParams));
};

export { useQuery, useQueries, useInfiniteQuery, prepareMeeloQuery, prepareMeeloInfiniteQuery };
