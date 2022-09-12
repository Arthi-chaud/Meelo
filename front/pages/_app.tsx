import { useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider, Hydrate, QueryCache } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import "../styles/global.css";
import { Box } from "@mui/material";
import MeeloAppBar from "../src/components/appbar/appbar";
import { ErrorBoundary } from 'react-error-boundary'
import toast, { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }: AppProps) {
	const [queryClient] = useState(() => new QueryClient());
	const [errorDsiplayed, setErrorDisplayed] = useState(false);
	return (
		<Box>
			<ErrorBoundary
				FallbackComponent={() => <Box/>}
				onError={(error: Error) => toast.error(error.message, { position: 'bottom-center', duration: 3600 })}
			>
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
			<Toaster/>
		</Box>
	);
}

export default MyApp;