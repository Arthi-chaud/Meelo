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

import type { PaletteOptions, ThemeOptions } from "@mui/material";

const LightTheme: Omit<PaletteOptions, "mode"> = {
	primary: {
		main: "#242120",
	},
	secondary: {
		main: "#242120",
	},
};

const DarkTheme: Omit<PaletteOptions, "mode"> = {
	primary: {
		main: "#ffffff",
	},
	secondary: {
		main: "#ffffff",
	},
	background: {
		default: "#242120",
		paper: "#242120",
	},
	text: {
		primary: "#FFFFFF",
		secondary: "#FFFFFF",
	},
};

const GlobalTheme: Omit<ThemeOptions, "palette"> = {
	shape: {
		borderRadius: 8,
	},
	components: {
		MuiTypography: {
			styleOverrides: {
				root: {
					overflow: "hidden",
					textOverflow: "ellipsis",
				},
			},
		},
		MuiListItemText: {
			styleOverrides: {
				root: {
					whiteSpace: "nowrap",
				},
			},
		},
		MuiListSubheader: {
			styleOverrides: {
				root: {
					zIndex: 0,
				},
			},
		},
		MuiButtonBase: {
			styleOverrides: {
				root: {
					borderRadius: 8,
				},
			},
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					borderRadius: "0",
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					borderRadius: "0",
				},
			},
		},
		MuiSelect: {
			styleOverrides: {
				icon: {
					color: "inherit",
				},
			},
		},
		MuiSkeleton: {
			styleOverrides: {
				root: {
					variant: "text",
					width: "100%",
				},
			},
		},
	},
};

export { LightTheme, DarkTheme, GlobalTheme };
