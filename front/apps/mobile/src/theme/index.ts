import { Appearance } from "react-native";
import { StyleSheet } from "react-native-unistyles";
const baseTheme = {
	gap: (n: number) => n * 8,
	// TODO Use font size from device
	fontSize: {
		default: 14,
		rem: (ratio: number) => 14 * ratio,
	},
	borderRadius: 8, // TODO Normalise?
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
		semiBold: {
			fontFamily: "Rubik_600SemiBold",
		},
		bold: {
			fontFamily: "Rubik_700Bold",
		},
	},
};

export const lightTheme = {
	name: "light" as const,
	...baseTheme,
	colors: {
		text: {
			primary: "#242120",
			secondary: "rgba(0, 0, 0, 0.38)",
			onAccentSurface: "#ffffff",
			error: "#ff2c2c",
		},

		error: "#ff2c2c",
		success: "green",
		divider: "rgba(0, 0, 0, 0.38)",
		button: "#242120",
		background: "#efefef",
	},
};

export const darkTheme = {
	name: "dark" as const,
	...baseTheme,
	colors: {
		text: {
			primary: "#ffffff",
			secondary: "rgba(255, 255, 255, 0.58)",
			onAccentSurface: "#000000",
		},
		error: "#ff2c2c",
		success: "green",
		divider: "rgba(255, 255, 255, 0.58)",
		button: "#efefef",
		background: "#242120",
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
	light: { ...lightTheme, op: darkTheme },
	dark: { ...darkTheme, op: lightTheme },
};

StyleSheet.configure({
	themes: appThemes,
	breakpoints,
	settings: {
		// TODO Use local storage
		initialTheme: () => {
			const ap = Appearance.getColorScheme();
			return ap ?? "light";
		},
	},
});

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
	export interface UnistylesThemes extends AppThemes {}
	export interface UnistylesBreakpoints extends AppBreakpoints {}
}
