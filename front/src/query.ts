import { QueryFunctionContext } from "react-query";
import API from "./api";
import { InfiniteFetchFn } from "./components/infinite/infinite-list";
type Key = string | number

type MeeloQueryFn<T = unknown> = <Arg extends Key,>(...args: Arg[]) => ({
	key: Key[],
	exec: () => Promise<T>
});

type MeeloInfiniteQueryFn<T = unknown> = <Arg extends Key,>(...args: Arg[]) => ({
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
	const enabled = queryArgs.findIndex((elem) => elem === undefined) === -1;
	const queryParams = query(...queryArgs as Key[]);
	return {
		queryKey: queryParams.key,
		queryFn: queryParams.exec,
		enabled: enabled,
		...defaultMeeloQueryOptions
	};
}

/**
 * Wrapper for 'react-query''s useInfiniteQuery's parameters, to manage dependent queries more easily
 * @param query the function that prepare the query
 * @param queryArgs the arguments to pass the the query function. If one of them is undefined, the query will not be enabled
 * @returns 
 */
const prepareMeeloInfiniteQuery = <T,>(query: MeeloInfiniteQueryFn<T>, ...queryArgs: Partial<Parameters<typeof query>>) => {
	const enabled = queryArgs.findIndex((elem) => elem === undefined) === -1;
	const queryParams = query(...queryArgs as Key[]);
	return {
		queryKey: queryParams.key,
		queryFn: (context: QueryFunctionContext) => queryParams.exec(context.pageParam ?? { index: 0, pageSize: API.defaultPageSize }),
		enabled: enabled,
		...defaultMeeloQueryOptions
	};
}
export { prepareMeeloQuery, prepareMeeloInfiniteQuery };