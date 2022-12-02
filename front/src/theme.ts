import { createTheme, responsiveFontSizes } from "@mui/material";

export default responsiveFontSizes(createTheme({
	palette: {
		mode: 'dark',
		primary: {
			main: "#242120",
			light: "#676767",
			contrastText: "#FFFFFF"
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
		}
	},
	shape: {
		borderRadius: '0.5rem' as unknown as number
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
					borderRadius: '0.5rem'
				}
			}
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					borderRadius: '0'
				}
			}
		}
	}
}));

export const Styles = {
	// eslint-disable-next-line id-length
	'a': {
		color: 'inherit',
		textDecoration: 'none'
	},
	/* width */
	'::-webkit-scrollbar': {
		width: '8px'
	},

	/* Track */
	'::-webkit-scrollbar-track': {
		display: 'none'
	},

	/* Handle */
	'::-webkit-scrollbar-thumb': {
		'background': '#676767',
		'border-radius': '4px'
	},

	/* Handle on hover */
	'::-webkit-scrollbar-thumb:hover': {
		background: '#555'
	},
};
