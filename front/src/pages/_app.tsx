/* eslint-disable id-length */
import { ConfirmProvider } from "material-ui-confirm";
import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import {
	// eslint-disable-next-line no-restricted-imports
	Hydrate, QueryClient, QueryClientProvider
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { Container } from "@mui/material";
import { ErrorBoundary } from 'react-error-boundary';
import toast, { Toaster } from 'react-hot-toast';
import Head from "next/head";
import { Provider } from "react-redux";
import AuthenticationWall from "../components/authentication/authentication-wall";
import { DefaultWindowTitle } from '../utils/constants';
import { ResourceNotFound } from "../exceptions";
import PageNotFound from "./404";
import InternalError from "./500";
import { useRouter } from "next/router";
import 'core-js/actual';
import '../theme/styles.css';
import ThemeProvider from "../theme/provider";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "../state/store";
import { DefaultMeeloQueryOptions } from "../api/use-query";
import createEmotionCache from "../utils/createEmotionCache";
import { CacheProvider, EmotionCache } from "@emotion/react";
import Scaffold from "../components/scaffold/scaffold";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
	emotionCache?: EmotionCache;
}

function MyApp({
	Component, pageProps: { session, ...pageProps }, emotionCache = clientSideEmotionCache
}: MyAppProps) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: DefaultMeeloQueryOptions
		}
	}));
	const router = useRouter();
	const [errorType, setError] = useState<'not-found' | 'error' | undefined>();

	useEffect(() => {
		setError(undefined);
	}, [router]);
	useEffect(() => {
		if (typeof Notification !== 'undefined' && Notification.permission != 'granted') {
			Notification.requestPermission();
		}
	}, []);
	return <CacheProvider value={emotionCache}>
		<Provider store={store}>
			<ThemeProvider>
				<Head>
					{/* It is recommended to leave this here. The rest has been moved to `_document` */}
					<title>{DefaultWindowTitle}</title>
					<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				</Head>
				<QueryClientProvider client={queryClient}>
					<PersistGate loading={null} persistor={persistor}>
						{() => (<ConfirmProvider defaultOptions={{
							cancellationButtonProps: {
								sx: { marginX: 2 }
							},
						}}>
							<Hydrate state={pageProps.dehydratedState}>
								<AuthenticationWall>
									<ErrorBoundary
										FallbackComponent={() => {
											if (errorType == 'not-found') {
												return <PageNotFound />;
											}
											return <InternalError />;
										}}
										onError={(error: Error) => {
											if (errorType) {
												toast.error(error.message);
											}
											if (error instanceof ResourceNotFound) {
												setError('not-found');
											} else {
												setError('error');
											}
										}}
									>
										<Scaffold>
											<Container maxWidth={false} sx={{ paddingY: 2 }}>
												<Component {...pageProps} />
											</Container>
										</Scaffold>
									</ErrorBoundary>
								</AuthenticationWall>
							</Hydrate>
						</ConfirmProvider>) }
					</PersistGate>
					<Toaster toastOptions={{ duration: 2500 }} position='bottom-center' />
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</ThemeProvider>
		</Provider>
	</CacheProvider>;
}

export default MyApp;
