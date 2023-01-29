/* eslint-disable id-length */
import { ConfirmProvider } from "material-ui-confirm";
import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import {
	// eslint-disable-next-line no-restricted-imports
	Hydrate, QueryClient, QueryClientProvider
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import {
	Container,
	CssBaseline, GlobalStyles, ThemeProvider, useTheme
} from "@mui/material";
import MeeloAppBar from "../components/appbar/appbar";
import { ErrorBoundary } from 'react-error-boundary';
import toast, { Toaster } from 'react-hot-toast';
import Head from "next/head";
import store from '../state/store';
import theme, { Styles } from "../theme";
import Player from "../components/player/player";
import { Provider } from "react-redux";
import AuthenticationWall from "../components/authentication/authentication-wall";
import { DefaultWindowTitle } from '../utils/constants';
import { ResourceNotFound } from "../exceptions";
import PageNotFound from "./404";
import InternalError from "./500";
import { useRouter } from "next/router";
import 'core-js/actual';
import '../styles.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	const [queryClient] = useState(() => new QueryClient());
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
	return <Provider store={store}>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<GlobalStyles styles={Styles}/>
			<Head>
				<title>{DefaultWindowTitle}</title>
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black"/>
				<link rel="shortcut icon" href="/favicon.ico"/>
				<link rel="apple-touch-icon" href="/favicon.ico"/>
			</Head>
			<QueryClientProvider client={queryClient}>
				<AuthenticationWall>
					<ConfirmProvider defaultOptions={{
						cancellationButtonProps: {
							sx: { marginX: 2 }
						},
					}}>
						<MeeloAppBar/>
						<ErrorBoundary
							FallbackComponent={() => {
								if (errorType == 'not-found') {
									return <PageNotFound/>;
								}
								return <InternalError/>;
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
							<Hydrate state={pageProps.dehydratedState}>
								<Container maxWidth={false} sx={{ paddingY: 2 }}>
									<Component {...pageProps} />
								</Container>
							</Hydrate>
							<Player/>
						</ErrorBoundary>
					</ConfirmProvider>
				</AuthenticationWall>
				<Toaster toastOptions={{ duration: 2500 }} position='bottom-center'/>
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</ThemeProvider>
	</Provider>;
}

export default MyApp;
