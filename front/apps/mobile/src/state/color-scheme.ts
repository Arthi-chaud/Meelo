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

		const actualColorScheme =
			newColorScheme === "system"
				? (Appearance.getColorScheme() ?? "light")
				: newColorScheme;
		UnistylesRuntime.setTheme(actualColorScheme);
		Appearance.setColorScheme(actualColorScheme);
		set(_colorSchemePreference, newColorScheme);
	},
);

const _colorSchemePreference = atom(
	(storage.getString(ColorSchemeKey) ?? "system") as ColorScheme | "system",
);
