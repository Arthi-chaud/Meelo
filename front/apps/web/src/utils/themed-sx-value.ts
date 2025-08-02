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

import { useTheme } from "@mui/material";
import type { StandardCSSProperties } from "@mui/system/styleFunctionSx/StandardCssProperties";

/**
 * Utilitary hook that formats a themed `sx` value
 * USE ONLY for an `sx` props. Not tested with `style`
 * @param lightValue The value to use when theme is light
 * @param darkValue The value to use when theme is dark
 */
export const useThemedSxValue = <
	Key extends keyof StandardCSSProperties,
	Value extends StandardCSSProperties[Key],
>(
	key: Key,
	lightValue: Value,
	darkValue: Value,
) => {
	const theme = useTheme();

	return {
		[key]: lightValue,
		[theme.getColorSchemeSelector("dark")]: {
			[key]: darkValue,
		},
	};
};
