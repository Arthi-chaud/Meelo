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

const Styles = {
	a: {
		color: "inherit",
		textDecoration: "none",
	},
	":root": {
		// To hide the background of scrollbars on firefox
		scrollbarColor: "gray transparent",
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
	"& .MuiDataGrid-container--top [role=row]": {
		backgroundColor: "transparent !important",
	},
};

export default Styles;
