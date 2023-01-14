import { createTheme, responsiveFontSizes } from "@mui/material";

export default responsiveFontSizes(createTheme({
	palette: {
		mode: 'dark',
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
	},
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
}));

export const Styles = {
	// eslint-disable-next-line id-length
	'a': {
		color: 'inherit',
		textDecoration: 'none'
	},
	/* width */
	'::-webkit-scrollbar': {
		width: '8px',
		height: '5px',
	},
	"::-webkit-scrollbar-corner": {
		background: '#00000000',
	},

	/* Track */
	'::-webkit-scrollbar-track': {
		display: 'none'
	},

	/* Handle */
	'::-webkit-scrollbar-thumb': {
		background: '#676767',
		borderRadius: '4px'
	},

	/* Handle on hover */
	'::-webkit-scrollbar-thumb:hover': {
		background: '#555'
	},
	'& .MuiDataGrid-cell:focus': {
		outline: 'none !important'
	},
	'& .MuiDataGrid-row:hover': {
		backgroundColor: 'transparent !important'
	},
};
