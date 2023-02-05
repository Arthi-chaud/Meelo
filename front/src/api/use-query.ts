/* eslint-disable no-restricted-imports */
import {
	QueryFunctionContext,
	useInfiniteQuery as useReactInfiniteQuery,
	useQueries as useReactQueries,
	useQuery as useReactQuery,
	useQueryClient as useReactQueryClient
} from "react-query";
import API from "./api";
import { InfiniteFetchFn, Page } from "../components/infinite/infinite-scroll";

type Key = string | number | Record<string, unknown>;

//// Query types

export type Query<Type> = {
	key: Key[],
	// @warning If you call this method 'by hand', please consider using a query client instead
	exec: () => Promise<Type>
};

export type InfiniteQuery<Type> = {
	key: Key[],
	exec: InfiniteFetchFn<Type>
}
//// Query functions

export type MeeloQueryFn<
	QueryReturnType = unknown,
	Params extends any[] = any[]
> = (...args: Params) => Query<QueryReturnType>

export type MeeloInfiniteQueryFn<
	QueryReturnType,
	Params extends any[] = any[]
> = (...args: Params) => InfiniteQuery<QueryReturnType>

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
		queries.map(([query, ...params]) => prepareMeeloQuery(query, ...params))
	);
};

/**
 * Wrapper for the react-query's *useInfiniteQuery*
 */
const useInfiniteQuery = <ReturnType, Params extends any[]>(
	query: MeeloInfiniteQueryFn<ReturnType, Params>,
	...queryParams: Partial<Params>
) => {
	const pageSize = API.defaultPageSize;

	return useReactInfiniteQuery({
		...prepareMeeloInfiniteQuery(query, ...queryParams),
		getNextPageParam: (lastPage: Page<ReturnType>): Page<ReturnType> | undefined => {
			if (lastPage.end || lastPage.items.length < pageSize) {
				return undefined;
			}
			return lastPage;
		},
	});
};

/**
 * Wrapper of the useQueryClient Hook, to wrap `prepareMeeloQuery`
 */
const useQueryClient = () => {
	const queryClient = useReactQueryClient();

	return {
		client: queryClient,
		fetchQuery: <R, Params extends any[]>(
			query: ReturnType<MeeloQueryFn<R, Params>>
		) => queryClient.fetchQuery(prepareMeeloQuery(() => query))
	};
};

export type QueryClient = ReturnType<typeof useQueryClient>;

export { useQuery, useQueries, useInfiniteQuery, useQueryClient, prepareMeeloQuery, prepareMeeloInfiniteQuery };
