import { useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider, Hydrate } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import "../../styles/global.css";
import { Box, CssBaseline, Fab, ThemeProvider } from "@mui/material";
import MeeloAppBar from "../components/appbar/appbar";
import { ErrorBoundary } from 'react-error-boundary'
import toast, { Toaster } from 'react-hot-toast';
import Head from "next/head";
import store from '../state/store'
import darkTheme from "../theme";
import Player from "../components/player/player";
import { Provider } from "react-redux";
import GlobalStyles from '@mui/material/GlobalStyles';

function MyApp({ Component, pageProps }: AppProps) {
	const [queryClient] = useState(() => new QueryClient());
	const [theme, setTheme] = useState(darkTheme);
	return <Provider store={store}>
		<ThemeProvider theme={theme}>
			<GlobalStyles styles={{ a: { color: theme.palette.secondary.main, textDecoration: 'none' } }} />
			<CssBaseline />
			<Head>
    			<title>Meelo</title>
    			<meta name="viewport" content="initial-scale=1.0, width=device-width" />
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