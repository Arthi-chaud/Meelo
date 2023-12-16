const Styles = {
	// eslint-disable-next-line id-length
	a: {
		color: "inherit",
		textDecoration: "none",
	},
	/* width */
	"::-webkit-scrollbar": {
		width: "8px",
		height: "5px",
	},
	"::-webkit-scrollbar-corner": {
		background: "#00000000",
	},

	/* Track */
	"::-webkit-scrollbar-track": {
		display: "none",
	},

	/* Handle */
	"::-webkit-scrollbar-thumb": {
		background: "#676767",
		borderRadius: "4px",
	},

	/* Handle on hover */
	"::-webkit-scrollbar-thumb:hover": {
		background: "#555",
	},
	"& .MuiDataGrid-cell:focus": {
		outline: "none !important",
	},
	"& .MuiDataGrid-row:hover": {
		backgroundColor: "transparent !important",
	},
};

export default Styles;
