import {
	// eslint-disable-next-line no-restricted-imports
	CssBaseline, GlobalStyles, ThemeProvider as MUIThemeProvider,
	createTheme, responsiveFontSizes
} from "@mui/material";
import Styles from "./style";
import { useMemo } from "react";
import {
	DarkTheme, GlobalTheme, LightTheme
} from "./theme";
import useColorScheme from "./color-scheme";

/**
 * Provides the Theme
 */
const ThemeProvider = (props: { children: any }) => {
	const colorScheme = useColorScheme();
	const theme = useMemo(
		() => {
			return responsiveFontSizes(createTheme({
				palette: {
					mode: colorScheme,
					...colorScheme == 'light' ? LightTheme : DarkTheme
				},
				...GlobalTheme
			}));
		},
		[colorScheme]
	);

	return <MUIThemeProvider theme={theme}>
		<CssBaseline />
		<GlobalStyles styles={Styles}/>
		{ props.children }
	</MUIThemeProvider>;
};

export default ThemeProvider;