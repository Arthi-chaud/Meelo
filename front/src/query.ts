type Key = string | number

type MeeloQueryFn<T = unknown> = <Arg extends Key,>(...args: Arg[]) => ({
	key: Key[],
	exec: () => Promise<T>
});

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
		enabled: enabled
	};
}
export default prepareMeeloQuery;