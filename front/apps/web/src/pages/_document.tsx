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

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import {
	DocumentHeadTags,
	type DocumentHeadTagsProps,
	documentGetInitialProps,
} from "@mui/material-nextjs/v14-pagesRouter";
import {
	type DocumentContext,
	type DocumentProps,
	Head,
	Html,
	Main,
	NextScript,
} from "next/document";
import font from "~/theme/font";
import { LightTheme } from "~/theme/theme";

export default function MyDocument(
	props: DocumentProps & DocumentHeadTagsProps,
) {
	return (
		<Html className={font.className} lang="en" data-color-scheme="system">
			<Head>
				<DocumentHeadTags {...props} />
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
				<link rel="shortcut icon" href="/favicon-black.ico" />
				<link rel="apple-touch-icon" href="/favicon-black.ico" />
			</Head>
			<body style={{ height: "100lvh" }}>
				<InitColorSchemeScript defaultMode="system" attribute="class" />
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
MyDocument.getInitialProps = async (ctx: DocumentContext) => {
	const finalProps = await documentGetInitialProps(ctx);
	return finalProps;
};
