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

import createEmotionServer from "@emotion/server/create-instance";
import { getInitColorSchemeScript } from "@mui/material/styles";
import type { AppType } from "next/app";
import Document, {
	type DocumentContext,
	type DocumentProps,
	Head,
	Html,
	Main,
	NextScript,
} from "next/document";
import type * as React from "react";
import font from "~/theme/font";
import { LightTheme } from "~/theme/theme";
import createEmotionCache from "~/utils/createEmotionCache";
import type { MyAppProps } from "./_app";

interface MyDocumentProps extends DocumentProps {
	emotionStyleTags: JSX.Element[];
}

export default function MyDocument({ emotionStyleTags }: MyDocumentProps) {
	return (
		<Html className={font.className} lang="en" data-color-scheme="system">
			<Head>
				<meta charSet="utf-8" />
				<meta
					name="keywords"
					content="Music Server Self-Hosted Collection"
				/>
				<meta
					name="description"
					content="Self-Hosted, Personal Music Server, designed for collectors and music maniacs."
				/>
				<meta name="apple-mobile-web-app-title" content="Meelo" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content={LightTheme.background?.default}
				/>
				<meta
					name="~/theme-color"
					content={LightTheme.background?.default}
				/>
				<link rel="shortcut icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/favicon.ico" />
				<meta name="emotion-insertion-point" content="" />
				{emotionStyleTags}
			</Head>
			<body style={{ height: "100lvh" }}>
				{getInitColorSchemeScript({ defaultMode: "system" })}
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
				App: React.ComponentType<
					React.ComponentProps<AppType> & MyAppProps
				>,
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
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Safe
			dangerouslySetInnerHTML={{ __html: style.css }}
		/>
	));

	return {
		...initialProps,
		emotionStyleTags,
	};
};
