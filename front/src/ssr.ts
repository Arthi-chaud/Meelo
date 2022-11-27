// eslint-disable-next-line no-restricted-imports
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
// eslint-disable-next-line no-restricted-imports
import { QueryClient, dehydrate } from "react-query";
import {
	InfiniteQuery, Query, prepareMeeloInfiniteQuery, prepareMeeloQuery
} from "./api/use-query";
import store from "./state/store";
import { setAccessToken } from "./state/userSlice";
import UserAccessTokenCookieKey from "./utils/user-access-token-cookie-key";

/**
 * Get the router + query client
 * return queries to prefetch
 * return infinite queries to prefetch
 * return additional props
 */

/**
 * Parameters needed for server-side rendering
 */
type SSRParameters<
	AdditionalProps = Record<string, number | null | string>
> = {
	/**
	 * Queries to prefetch
	 */
	queries?: Query<any>[];
	/**
	 * Infinite Queries to prefetch
	 */
	infiniteQueries?: InfiniteQuery<any>[];
	additionalProps?: AdditionalProps;
}

/**
 * Wrapper for *InferGetServerSidePropsType* provided by Next
 */
export type InferSSRProps<T extends (args: any) => any> = NonNullable<InferGetServerSidePropsType<T>['additionalProps']>;
/**
 * Wrapper for Server-side rendering
 * @param context
 * @returns
 */
const prepareSSR = <AdditionalProps>(
	cook: (
		routeParam: Pick<GetServerSidePropsContext, 'req' | 'query' | 'params'>
	) => SSRParameters<AdditionalProps>
) => {
	return async (context: GetServerSidePropsContext) => {
		const queryClient = new QueryClient();
		const parameters = cook(context);

		store.dispatch(setAccessToken(context.req.cookies[UserAccessTokenCookieKey]));
		if (!store.getState().user.accessToken) {
			// Disable SSR if user is not authentified
			return { props: {} };
		}
		try {
			await Promise.all([
				parameters.infiniteQueries?.map(
					(query) => queryClient.prefetchInfiniteQuery(
						prepareMeeloInfiniteQuery(() => query)
					)
				),
				parameters.queries?.map(
					(query) => queryClient.prefetchQuery(
						prepareMeeloQuery(() => query)
					)
				)
			]);
		} catch {
			return {
				notFound: true,
			};
		}
		return {
			props: {
				additionalProps: parameters.additionalProps ?? null,
				dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
			}
		};
	};
};

export default prepareSSR;
