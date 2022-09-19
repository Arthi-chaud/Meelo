import { useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider, Hydrate, QueryCache } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import "../../styles/global.css";
import { Box } from "@mui/material";
import MeeloAppBar from "../components/appbar/appbar";
import { ErrorBoundary } from 'react-error-boundary'
import toast, { Toaster } from 'react-hot-toast';
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
	const [queryClient] = useState(() => new QueryClient());
	return (
		<Box>
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
				</ErrorBoundary>
				<Toaster toastOptions={{ duration: 10000 }} position='bottom-center'/>
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</Box>
	);
}

export default MyApp;