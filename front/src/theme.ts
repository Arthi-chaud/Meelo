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
			main: "#D9D9D9"
		},
		background: {
			default: "#242120",
			paper: "#242120"
		},
		text: {
			primary: "#FFFFFF"
		}
	},
	shape: {
		borderRadius: '3%'
	}	
}));