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

import {
	// eslint-disable-next-line no-restricted-imports
	CssBaseline,
	GlobalStyles,
	ThemeProvider as MUIThemeProvider,
	createTheme,
	responsiveFontSizes,
} from "@mui/material";
import Styles from "./style";
import { useMemo } from "react";
import { DarkTheme, GlobalTheme, LightTheme } from "./theme";
import useColorScheme from "./color-scheme";
import font from "./font";

/**
 * Provides the Theme
 */
const ThemeProvider = (props: { children: any }) => {
	const colorScheme = useColorScheme();
	const theme = useMemo(() => {
		return responsiveFontSizes(
			createTheme({
				palette: {
					mode: colorScheme,
					...(colorScheme == "light" ? LightTheme : DarkTheme),
				},
				typography: {
					fontFamily: font.style.fontFamily,
				},
				...GlobalTheme,
			}),
		);
	}, [colorScheme]);

	return (
		<MUIThemeProvider theme={theme}>
			<CssBaseline />
			<GlobalStyles styles={Styles} />
			{props.children}
		</MUIThemeProvider>
	);
};

export default ThemeProvider;
