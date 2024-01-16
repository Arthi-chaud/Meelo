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

// eslint-disable-next-line no-restricted-imports
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
// eslint-disable-next-line no-restricted-imports
import { QueryClient, dehydrate } from "react-query";
import {
	InfiniteQuery,
	Query,
	prepareMeeloInfiniteQuery,
	prepareMeeloQuery,
} from "./api/use-query";
import store from "./state/store";
import { setAccessToken } from "./state/userSlice";
import { UserAccessTokenCookieKey } from "./utils/cookieKeys";
import API from "./api/api";
import { Promisable } from "type-fest";

/**
 * Get the router + query client
 * return queries to prefetch
 * return infinite queries to prefetch
 * return additional props
 */

/**
 * Parameters needed for server-side rendering
 */
type SSRParameters<AdditionalProps = Record<string, number | null | string>> = {
	/**
	 * Queries to prefetch
	 */
	queries?: Query<any>[];
	/**
	 * Infinite Queries to prefetch
	 */
	infiniteQueries?: InfiniteQuery<any>[];
	additionalProps?: AdditionalProps;
};

/**
 * Wrapper for *InferGetServerSidePropsType* provided by Next
 */
export type InferSSRProps<T extends (args: any) => any> = NonNullable<
	InferGetServerSidePropsType<T>
>;
/**
 * Wrapper for Server-side rendering
 * @param context
 * @returns
 */
const prepareSSR = <AdditionalProps>(
	cook: (
		routeParam: Pick<GetServerSidePropsContext, "req" | "query" | "params">,
		queryClient: QueryClient,
	) => Promisable<SSRParameters<AdditionalProps>>,
) => {
	return async (context: GetServerSidePropsContext) => {
		const queryClient = new QueryClient();
		const accessToken = context.req.cookies[UserAccessTokenCookieKey];

		if (accessToken) {
			store.dispatch(setAccessToken(accessToken));
		} else {
			// Disable SSR if user is not authentified
			return { props: {} };
		}
		const parameters = await cook(context, queryClient);

		const userQueryResult = await queryClient
			.fetchQuery(prepareMeeloQuery(API.getCurrentUserStatus))
			.catch(() => null);
		if (userQueryResult != null) {
			try {
				await Promise.all([
					queryClient.prefetchInfiniteQuery(
						prepareMeeloInfiniteQuery(API.getLibraries),
					),
					...(parameters.infiniteQueries?.map((query) =>
						queryClient.prefetchInfiniteQuery(
							prepareMeeloInfiniteQuery(() => query),
						),
					) ?? []),
					...(parameters.queries?.map((query) =>
						queryClient.prefetchQuery(
							prepareMeeloQuery(() => query),
						),
					) ?? []),
				]);
			} catch {
				return {
					notFound: true,
				};
			}
		}
		const dehydratedQueryClient = dehydrate(queryClient, {
			dehydrateQueries: true,
		});

		return {
			props: {
				additionalProps: parameters.additionalProps ?? null,
				dehydratedState: JSON.parse(
					JSON.stringify(dehydratedQueryClient),
				),
			},
		};
	};
};

export default prepareSSR;
