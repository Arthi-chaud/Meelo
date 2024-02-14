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

/* eslint-disable no-restricted-imports */
import { ConfirmProvider } from "material-ui-confirm";
import { useEffect, useState } from "react";
import NextApp, { AppContext, AppProps } from "next/app";
import {
	Hydrate,
	QueryClient,
	QueryClientProvider,
	dehydrate,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { ErrorBoundary } from "react-error-boundary";
import toast from "react-hot-toast";
import Toaster from "../components/toaster";
import Head from "next/head";
import { Provider } from "react-redux";
import AuthenticationWall from "../components/authentication/authentication-wall";
import { DefaultWindowTitle } from "../utils/constants";
import { ResourceNotFound } from "../exceptions";
import PageNotFound from "./404";
import InternalError from "./500";
import { useRouter } from "next/router";
import "core-js/actual";
import "../theme/styles.css";
import ThemeProvider from "../theme/provider";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "../state/store";
import {
	DefaultMeeloQueryOptions,
	prepareMeeloInfiniteQuery,
	prepareMeeloQuery,
} from "../api/use-query";
import createEmotionCache from "../utils/createEmotionCache";
import { CacheProvider, EmotionCache } from "@emotion/react";
import Scaffold from "../components/scaffold/scaffold";
import { withTranslations } from "../i18n/i18n";
import { PlayerContextProvider } from "../contexts/player";
import { Page } from "../ssr";
import { UserAccessTokenCookieKey } from "../utils/cookieKeys";
import { setAccessToken } from "../state/userSlice";
import API from "../api/api";
import { deepmerge } from "@mui/utils";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
	emotionCache?: EmotionCache;
}

function MyApp({
	Component,
	pageProps: { session, lng, ...pageProps },
	emotionCache = clientSideEmotionCache,
}: MyAppProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: DefaultMeeloQueryOptions,
				},
			}),
	);
	const router = useRouter();
	const [errorType, setError] = useState<"not-found" | "error" | undefined>();
	useEffect(() => {
		setError(undefined);
	}, [router]);
	return (
		<CacheProvider value={emotionCache}>
			<Provider store={store}>
				<ThemeProvider>
					<Head>
						{/* It is recommended to leave this here. The rest has been moved to `_document` */}
						<title>{DefaultWindowTitle}</title>
						<meta
							name="viewport"
							content="initial-scale=1.0, width=device-width"
						/>
					</Head>
					<QueryClientProvider client={queryClient}>
						<PersistGate loading={null} persistor={persistor}>
							{() => (
								<ConfirmProvider
									defaultOptions={{
										cancellationButtonProps: {
											sx: { marginX: 2 },
										},
									}}
								>
									<Hydrate state={pageProps.dehydratedState}>
										<AuthenticationWall>
											<ErrorBoundary
												FallbackComponent={() => {
													if (
														errorType == "not-found"
													) {
														return <PageNotFound />;
													}
													return <InternalError />;
												}}
												onError={(error: Error) => {
													if (errorType) {
														toast.error(
															error.message,
														);
													}
													if (
														error instanceof
														ResourceNotFound
													) {
														setError("not-found");
													} else {
														setError("error");
													}
												}}
											>
												<PlayerContextProvider>
													<Scaffold>
														<Component
															{...pageProps}
														/>
													</Scaffold>
												</PlayerContextProvider>
											</ErrorBoundary>
										</AuthenticationWall>
									</Hydrate>
								</ConfirmProvider>
							)}
						</PersistGate>
						<Toaster />
						<ReactQueryDevtools initialIsOpen={false} />
					</QueryClientProvider>
				</ThemeProvider>
			</Provider>
		</CacheProvider>
	);
}

MyApp.getInitialProps = async (appContext: AppContext) => {
	const { pageProps } = await NextApp.getInitialProps(appContext);
	const Component = appContext.Component as unknown as Page;

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: DefaultMeeloQueryOptions,
		},
	});
	const accessToken: string | undefined = (appContext.ctx.req as any)
		?.cookies[UserAccessTokenCookieKey];

	if (accessToken) {
		store.dispatch(setAccessToken(accessToken));
	} else {
		// Disable SSR if user is not authentified
		return { pageProps: {} };
	}
	const { queries, infiniteQueries, additionalProps } =
		(await Component.prepareSSR?.(appContext.ctx, queryClient)) ?? {};

	const userQueryResult = await queryClient
		.fetchQuery(prepareMeeloQuery(API.getCurrentUserStatus))
		.catch(() => null);
	if (userQueryResult != null) {
		try {
			await Promise.all([
				queryClient.prefetchInfiniteQuery(
					prepareMeeloInfiniteQuery(API.getLibraries),
				),
				...(infiniteQueries?.map((query) =>
					queryClient.prefetchInfiniteQuery(
						prepareMeeloInfiniteQuery(() => query),
					),
				) ?? []),
				...(queries?.map((query) =>
					queryClient.prefetchQuery(prepareMeeloQuery(() => query)),
				) ?? []),
			]);
		} catch {
			return {
				pageProps: {},
				notFound: true,
			};
		}
	}
	const dehydratedQueryClient = dehydrate(queryClient, {
		dehydrateQueries: true,
	});

	return {
		pageProps: {
			props: deepmerge(pageProps, additionalProps),
			dehydratedState: JSON.parse(JSON.stringify(dehydratedQueryClient)),
		},
	};
};

export default withTranslations(MyApp);
