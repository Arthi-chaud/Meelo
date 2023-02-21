import { PaletteOptions, ThemeOptions } from "@mui/material";

const LightTheme: Omit<PaletteOptions, 'mode'> = {

};

const DarkTheme: Omit<PaletteOptions, 'mode'> = {
	primary: {
		main: "#ffffff"
	},
	secondary: {
		main: "#ffffff"
	},
	background: {
		default: "#242120",
		paper: "#242120"
	},
	text: {
		primary: "#FFFFFF",
		secondary: '#FFFFFF'
	},
};

const GlobalTheme: Omit<ThemeOptions, 'palette'> = {
	shape: {
		borderRadius: 8
	},
	components: {
		MuiTypography: {
			styleOverrides: {
				root: {
					overflow: 'hidden',
					textOverflow: 'ellipsis'
				}
			}
		},
		MuiListItemText: {
			styleOverrides: {
				root: {
					whiteSpace: 'nowrap'
				}
			}
		},
		MuiListSubheader: {
			styleOverrides: {
				root: {
					zIndex: 0
				}
			}
		},
		MuiButtonBase: {
			styleOverrides: {
				root: {
					borderRadius: 8
				}
			}
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					borderRadius: '0'
				}
			}
		},
		MuiTab: {
			styleOverrides: {
				root: {
					borderRadius: '0'
				}
			}
		}
	}
};

export { LightTheme, DarkTheme, GlobalTheme };
