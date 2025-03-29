import { ResourceNotFound } from "exceptions";
/* eslint-disable no-restricted-imports */
import { ConfirmProvider } from "material-ui-confirm";
import NextApp, { type AppContext, type AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import toast from "react-hot-toast";
import {
	Hydrate,
	QueryClient,
	QueryClientProvider,
	dehydrate,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import AuthenticationWall from "~/components/authentication/wall";
import Toaster from "~/components/toaster";
import { DefaultWindowTitle } from "~/utils/constants";
import PageNotFound from "./404";
import InternalError from "./500";
import "core-js/actual";
import "~/theme/styles.css";
import { CacheProvider, type EmotionCache } from "@emotion/react";
import { deepmerge } from "@mui/utils";
import { Provider } from "jotai";
import type { Page } from "ssr";
import API from "~/api/api";
import {
	DefaultMeeloQueryOptions,
	prepareMeeloInfiniteQuery,
	prepareMeeloQuery,
} from "~/api/use-query";
import { KeyboardBindingModal } from "~/components/keyboard-bindings-modal";
import Scaffold from "~/components/scaffold";
import { KeyboardBindingsProvider } from "~/contexts/keybindings";
import { withTranslations } from "~/i18n/i18n";
import { store } from "~/state/store";
import { accessTokenAtom } from "~/state/user";
import ThemeProvider from "~/theme/provider";
import { UserAccessTokenCookieKey } from "~/utils/cookieKeys";
import createEmotionCache from "~/utils/createEmotionCache";

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
					{/* 
						Recommended for SSR
						https://jotai.org/docs/guides/nextjs#provider
					*/}
					<Provider store={store}>
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
											if (errorType === "not-found") {
												return <PageNotFound />;
											}
											return <InternalError />;
										}}
										onError={(error: Error) => {
											if (errorType) {
												toast.error(error.message);
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
										<KeyboardBindingsProvider>
											<KeyboardBindingModal />
											<Scaffold>
												<Component {...pageProps} />
											</Scaffold>
										</KeyboardBindingsProvider>
									</ErrorBoundary>
								</AuthenticationWall>
							</Hydrate>
						</ConfirmProvider>
					</Provider>
					<Toaster />
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</ThemeProvider>
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

	if (!accessToken) {
		// Disable SSR if user is not authentified
		return { pageProps: {} };
	}
	store.set(accessTokenAtom, accessToken);
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
			dehydratedState: dehydratedQueryClient,
		},
	};
};

export default withTranslations(MyApp);
