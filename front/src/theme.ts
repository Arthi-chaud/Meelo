import { createTheme, responsiveFontSizes } from "@mui/material";

export default  responsiveFontSizes(createTheme({
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
		borderRadius: '0.5rem'
	},
	components: {
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
		}
	}
}));