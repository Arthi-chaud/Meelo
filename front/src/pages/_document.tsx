import * as React from "react";
import Document, {
	DocumentContext,
	DocumentProps,
	Head,
	Html,
	Main,
	NextScript,
} from "next/document";
import createEmotionServer from "@emotion/server/create-instance";
import { AppType } from "next/app";
import { LightTheme } from "../theme/theme";
import createEmotionCache from "../utils/createEmotionCache";
import { MyAppProps } from "./_app";
import font from "../theme/font";

interface MyDocumentProps extends DocumentProps {
	emotionStyleTags: JSX.Element[];
}

export default function MyDocument({ emotionStyleTags }: MyDocumentProps) {
	return (
		<Html className={font.className} lang="en">
			<Head>
				<meta name="description" content="Self-Hosted, Personal Music Server, designed for collectors and music maniacs."/>
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black" />
				<meta name="theme-color" content={LightTheme.background?.default}/>
				<link rel="shortcut icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/favicon.ico" />
				<meta name="emotion-insertion-point" content="" />
				{emotionStyleTags}
			</Head>
			<body style={{ height: '100vh' }}>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx: DocumentContext) => {
	// Resolution order
	//
	// On the server:
	// 1. app.getInitialProps
	// 2. page.getInitialProps
	// 3. document.getInitialProps
	// 4. app.render
	// 5. page.render
	// 6. document.render
	//
	// On the server with error:
	// 1. document.getInitialProps
	// 2. app.render
	// 3. page.render
	// 4. document.render
	//
	// On the client
	// 1. app.getInitialProps
	// 2. page.getInitialProps
	// 3. app.render
	// 4. page.render

	const originalRenderPage = ctx.renderPage;

	// You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
	// However, be aware that it can have global side effects.
	const cache = createEmotionCache();
	const { extractCriticalToChunks } = createEmotionServer(cache);

	ctx.renderPage = () =>
		originalRenderPage({
			enhanceApp: (
				App: React.ComponentType<React.ComponentProps<AppType> & MyAppProps>
			) =>
				function EnhanceApp(props) {
					return <App emotionCache={cache} {...props} />;
				},
		});

	const initialProps = await Document.getInitialProps(ctx);
	// This is important. It prevents Emotion to render invalid HTML.
	// See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
	const emotionStyles = extractCriticalToChunks(initialProps.html);
	const emotionStyleTags = emotionStyles.styles.map((style) => (
		<style
			data-emotion={`${style.key} ${style.ids.join(" ")}`}
			key={style.key}
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: style.css }}
		/>
	));

	return {
		...initialProps,
		emotionStyleTags,
	};
};
