import { StyleSheet } from "react-native-unistyles";
const baseTheme = {
	// TODO Use font size from device
	fontSize: {
		default: 14,
		rem: (ratio: number) => 14 * ratio,
	},
	fontStyles: {
		light: {
			fontFamily: "Rubik_300Light",
		},
		regular: {
			fontFamily: "Rubik_400Regular",
		},
		medium: {
			fontFamily: "Rubik_500Medium",
		},
		bold: {
			fontFamily: "Rubik_700Bold",
		},
	},
};

export const lightTheme = {
	...baseTheme,
	colors: {
		primary: "#242120",
		secondary: "#242120",
		surface: "#efefef",
	},
};

export const darkTheme = {
	...baseTheme,
	colors: {
		primary: "#ffffff",
		secondary: "#ffffff",
		surface: "#242120",
	},
};

export const breakpoints = {
	xs: 0,
	sm: 300,
	md: 500,
	lg: 800,
	xl: 1200,
};

export const appThemes = {
	light: lightTheme,
	dark: darkTheme,
};

StyleSheet.configure({
	themes: appThemes,
	breakpoints,
	// TODO Choose using local storage
	settings: { adaptiveThemes: true },
});

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
	export interface UnistylesThemes extends AppThemes {}
	export interface UnistylesBreakpoints extends AppBreakpoints {}
}
