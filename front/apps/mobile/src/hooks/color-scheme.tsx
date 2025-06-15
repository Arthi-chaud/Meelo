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

import { useEffect, useMemo } from "react";
import { Appearance, useColorScheme as useRNColorScheme } from "react-native";
import { UnistylesRuntime } from "react-native-unistyles";

export type ColorScheme = "light" | "dark";

// TODO Make this an atom
export const useColorScheme = () => {
	const userPreference = "system" as "system" | ColorScheme;
	const systemColorScheme = useRNColorScheme();
	const actualColorScheme = useMemo(
		() =>
			userPreference === "system"
				? (systemColorScheme ?? "light")
				: "light",
		[systemColorScheme, userPreference],
	);
	const setColorScheme = (
		setter: ColorScheme | ((c: ColorScheme) => ColorScheme),
	) => {
		const newTheme =
			typeof setter === "function" ? setter(actualColorScheme) : setter;
		// Note: if we don't use the unistyle rt to update the theme, some components may not be updated
		// E.g. icons and images
		// Not sure why
		UnistylesRuntime.setTheme(newTheme);
		Appearance.setColorScheme(newTheme);
	};
	useEffect(() => {
		UnistylesRuntime.setTheme(actualColorScheme);
	}, [actualColorScheme]);

	return [actualColorScheme, setColorScheme] as const;
};
