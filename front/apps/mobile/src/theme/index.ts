import { Appearance } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { store } from "@/state/store";
import { colorSchemePreference } from "~/state/color-scheme";

const baseTheme = {
	gap: (n: number) => n * 8,
	// TODO Use font size from device
	fontSize: {
		default: 14,
		rem: (ratio: number) => 14 * ratio,
	},
	layout: {
		grid: {
			columnCount: {
				xs: 3,
				sm: 4,
				md: 5,
				lg: 6,
				xl: 8,
			} satisfies Record<keyof typeof breakpoints, number>,
		},
	},

	animations: {
		fades: {
			stiffness: 430,
			damping: 220,
		},
		progress: {
			stiffness: 500,
			damping: 100,
		},
		pressable: {
			scaleOnPress: 0.98,
			damping: 15,
			stiffness: 200,
		},
		skeleton: {
			minOpacity: 0.4,
			pulse: {
				duration: 800,
			},
		},
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
		skeleton: "rgba(0, 0, 0, 0.18)",
		error: "#ff2c2c",
		success: "green",
		divider: "rgba(0, 0, 0, 0.18)",
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
		skeleton: "rgba(255, 255, 255, 0.13)",
		error: "#ff2c2c",
		success: "green",
		divider: "rgba(255, 255, 255, 0.13)",
		button: "#efefef",
		background: "#242120",
	},
};

// Note: Values are taken from the Unistyles doc
// They are close enough to MUI's
export const breakpoints = {
	xs: 0,
	sm: 576,
	md: 768,
	lg: 992,
	xl: 1200,
} as const;

export const appThemes = {
	light: { ...lightTheme, op: darkTheme },
	dark: { ...darkTheme, op: lightTheme },
};

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
	export interface UnistylesThemes extends AppThemes {}
	export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
	themes: appThemes,
	breakpoints: breakpoints,
	settings: {
		initialTheme: () => {
			const pref = store.get(colorSchemePreference);
			if (pref === "system") {
				return Appearance.getColorScheme() ?? "light";
			}
			return pref;
		},
	},
});
