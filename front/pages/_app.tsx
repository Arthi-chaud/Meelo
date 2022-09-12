import React from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider, Hydrate, QueryCache } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import "../styles/global.css";
import { Box } from "@mui/material";
import MeeloAppBar from "../src/components/appbar/appbar";
import { ErrorBoundary } from 'react-error-boundary'
import toast, { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }: AppProps) {
	const [queryClient] = React.useState(() => new QueryClient());
	return (
		<ErrorBoundary fallbackRender={(error) => {
			toast.error(error.error.message, { duration: 3600, position: 'bottom-center' });
			return <Toaster/>
		}}>
			<QueryClientProvider client={queryClient}>
				<Hydrate state={pageProps.dehydratedState}>
					<Box>
						<MeeloAppBar/>
						<Component {...pageProps} />
					</Box>
				</Hydrate>
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</ErrorBoundary>
	);
}

export default MyApp;