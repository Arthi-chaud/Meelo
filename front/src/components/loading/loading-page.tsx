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

import { Box } from "@mui/material";
import LoadingComponent from "./loading";

// TODO Delete?

/**
 * Component that take the whole page for a loading animation
 * It should be at the root of the component tree as its content position's will be `fixed`
 */
const LoadingPage = () => {
	return (
		<Box
			width="100%"
			height="100vh"
			position="fixed"
			display="flex"
			justifyContent="center"
			alignItems="center"
		>
			<LoadingComponent />
		</Box>
	);
};

export default LoadingPage;
