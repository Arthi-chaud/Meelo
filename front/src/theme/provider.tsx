import {
	// eslint-disable-next-line no-restricted-imports
	CssBaseline, GlobalStyles, ThemeProvider as MUIThemeProvider,
	createTheme, responsiveFontSizes, useMediaQuery
} from "@mui/material";
import Styles from "./style";
import { useSelector } from "react-redux";
import { RootState } from "../state/store";
import { useMemo } from "react";
import {
	DarkTheme, GlobalTheme, LightTheme
} from "./theme";

const ThemeProvider = (props: { children: any }) => {
	const colorSetting = useSelector((state: RootState) => state.settings.colorScheme);
	const systemPrefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const theme = useMemo(
		() => {
			const scheme = colorSetting == 'system' ?
				systemPrefersDarkMode ? 'dark' : 'light' :
				colorSetting;

			return responsiveFontSizes(createTheme({
				palette: {
					mode: scheme,
					...scheme == 'light' ? LightTheme : DarkTheme
				},
				...GlobalTheme
			}));
		},
		[colorSetting, systemPrefersDarkMode]
	);

	return <MUIThemeProvider theme={theme}>
		<CssBaseline />
		<GlobalStyles styles={Styles}/>
		{ props.children }
	</MUIThemeProvider>;
};

export default ThemeProvider;
