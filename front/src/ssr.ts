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
import API from "./api/api";
import { setLanguage } from "./state/settingsSlice";
import { Languages } from "./i18n/i18n";
import ALParser from 'accept-language-parser';

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
		const accessToken = context.req.cookies[UserAccessTokenCookieKey];

		if (accessToken) {
			store.dispatch(setAccessToken(accessToken));
		} else {
			// Disable SSR if user is not authentified
			return { props: {} };
		}
		// If SSR and no specific language is set, use request to determine the language.
		if (store.getState().settings.language == 'system') {
			store.dispatch(setLanguage(
				ALParser.pick(Array.from(Languages), context.req.headers["accept-language"] ?? 'en', { loose: true }) ?? 'en'
			));
		}
		try {
			await Promise.all([
				queryClient.prefetchQuery(prepareMeeloQuery(API.getCurrentUserStatus)),
				queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(API.getAllLibraries)),
				...parameters.infiniteQueries?.map(
					(query) => queryClient.prefetchInfiniteQuery(
						prepareMeeloInfiniteQuery(() => query)
					)
				) ?? [],
				...parameters.queries?.map(
					(query) => queryClient.prefetchQuery(
						prepareMeeloQuery(() => query)
					)
				) ?? []
			]);
		} catch {
			return {
				notFound: true,
			};
		}
		const dehydratedQueryClient = dehydrate(queryClient, { dehydrateQueries: true });

		return {
			props: {
				additionalProps: parameters.additionalProps ?? null,
				dehydratedState: JSON.parse(JSON.stringify(dehydratedQueryClient))
			}
		};
	};
};

export const isSSR = () => typeof window === 'undefined';

export const isClientSideRendering = () => !isSSR();

export default prepareSSR;
