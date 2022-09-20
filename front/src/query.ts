import { QueryFunctionContext } from "react-query";
import API from "./api";
import { InfiniteFetchFn } from "./components/infinite/infinite-scroll";

type Key = string | number | Object

export type MeeloQueryFn<T = unknown> = (...args: any[]) => ({
	key: Key[],
	exec: () => Promise<T>
});

export type MeeloInfiniteQueryFn<T = unknown> = (...args: any[]) => ({
	key: Key[],
	exec: InfiniteFetchFn<T>
});

const defaultMeeloQueryOptions = {
	useErrorBoundary: true,
	retry: 1
}

/**
 * Wrapper for 'react-query''s useQuery's parameters, to manage dependent queries more easily
 * @param query the function that prepare the query
 * @param queryArgs the arguments to pass the the query function. If one of them is undefined, the query will not be enabled
 * @returns 
 */
const prepareMeeloQuery = <T,>(query: MeeloQueryFn<T>, ...queryArgs: Partial<Parameters<typeof query>>) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...queryArgs as Parameters<typeof query>);
	return {
		queryKey: queryParams.key,
		queryFn: queryParams.exec,
		enabled: enabled,
		...defaultMeeloQueryOptions
	};
}

/**
 * Using the query parameters, defines if a query should be enabled or not
 * @param args 
 * @returns 
 */
const isEnabled = (args: any[]) => {
	return args.findIndex((elem) => (elem === undefined || elem === null)) === -1;
}

/**
 * Wrapper for 'react-query''s useInfiniteQuery's parameters, to manage dependent queries more easily
 * @param query the function that prepare the query
 * @param queryArgs the arguments to pass the the query function. If one of them is undefined, the query will not be enabled
 * @returns 
 */
const prepareMeeloInfiniteQuery = <T,>(query: MeeloInfiniteQueryFn<T>, ...queryArgs: Partial<Parameters<typeof query>>) => {
	const enabled = isEnabled(queryArgs);
	const queryParams = query(...queryArgs as Parameters<typeof query>);
	return {
		queryKey: queryParams.key,
		queryFn: (context: QueryFunctionContext) => queryParams.exec(context.pageParam ?? { index: 0, pageSize: API.defaultPageSize })
			.then((result) => ({
				pageSize: result.items.length,
				items: result.items,
				index: result.metadata.page,
				end: result.metadata.next === null
			})),
		enabled: enabled,
		...defaultMeeloQueryOptions
	};
}
export { prepareMeeloQuery, prepareMeeloInfiniteQuery };