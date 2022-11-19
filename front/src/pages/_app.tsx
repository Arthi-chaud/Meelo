/* eslint-disable id-length */
import { useState } from "react";
import type { AppProps } from "next/app";
import {
	Hydrate, QueryClient, QueryClientProvider
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import {
	Box, CssBaseline, GlobalStyles, ThemeProvider
} from "@mui/material";
import MeeloAppBar from "../components/appbar/appbar";
import { ErrorBoundary } from 'react-error-boundary';
import toast, { Toaster } from 'react-hot-toast';
import Head from "next/head";
import store from '../state/store';
import theme from "../theme";
import Player from "../components/player/player";
import { Provider } from "react-redux";
import { DefaultWindowTitle } from '../utils/constants';

function MyApp({ Component, pageProps }: AppProps) {
	const [queryClient] = useState(() => new QueryClient());

	return <Provider store={store}>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<GlobalStyles styles={{ a: { color: 'inherit', textDecoration: 'none' } }}/>
			<Head>
				<title>{DefaultWindowTitle}</title>
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<link rel="shortcut icon" href="/favicon.ico"/>
				<link rel="apple-touch-icon" href="/favicon.ico"/>
			</Head>
			<QueryClientProvider client={queryClient}>
				<MeeloAppBar/>
				<ErrorBoundary
					FallbackComponent={() => <Box/>}
					onError={(error: Error) => toast.error(error.message)}
				>
					<Hydrate state={pageProps.dehydratedState}>
						<Component {...pageProps} />
					</Hydrate>
					<Player/>
				</ErrorBoundary>
				<Toaster toastOptions={{ duration: 10000 }} position='bottom-center'/>
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</ThemeProvider>
	</Provider>;
}

export default MyApp;
