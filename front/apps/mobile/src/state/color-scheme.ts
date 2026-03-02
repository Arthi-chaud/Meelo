import { atom } from "jotai";
import { Appearance } from "react-native";
import { UnistylesRuntime } from "react-native-unistyles";
import { storage } from "~/utils/storage";

type ColorScheme = "light" | "dark";

export const ColorSchemeKey = "color-scheme";
export const colorSchemePreference = atom<
	ColorScheme | "system",
	[ColorScheme | "system"],
	void
>(
	(get) => get(_colorSchemePreference),
	(_, set, newColorScheme) => {
		storage.set(ColorSchemeKey, newColorScheme);
		const appearanceColorScheme = Appearance.getColorScheme();
		const actualColorScheme =
			newColorScheme === "system"
				? appearanceColorScheme === "unspecified" ||
					!appearanceColorScheme
					? "light"
					: appearanceColorScheme
				: newColorScheme;
		UnistylesRuntime.setTheme(actualColorScheme);
		set(_colorSchemePreference, newColorScheme);
	},
);

const _colorSchemePreference = atom(
	(storage.getString(ColorSchemeKey) ?? "system") as ColorScheme | "system",
);
