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

import { useEffect, useState } from "react";
import { Bars } from "react-loader-spinner";
import { Box, useTheme } from "@mui/material";
import Fade from "../fade";

/**
 * Base loading component
 * @returns
 */
const LoadingComponent = () => {
	const theme = useTheme();
	const [displayLoad, setDisplay] = useState(false);

	useEffect(() => {
		const timeId = setTimeout(() => setDisplay(true), 2000);

		return () => {
			clearTimeout(timeId);
		};
	}, []);
	return (
		<Fade in={displayLoad} timeout={500} mountOnEnter unmountOnExit>
			<Box>
				<Bars
					height="40"
					width="40"
					color={theme.palette.text.primary}
					ariaLabel="bars-loading"
				/>
			</Box>
		</Fade>
	);
};

/**
 * Loading component that take the whole width and center the loading animation
 * @returns
 */
type WideLoadingComponentProps = {
	verticalPadding?: number;
};
const WideLoadingComponent = (props: WideLoadingComponentProps) => (
	<Box
		width="100%"
		display="flex"
		justifyContent="center"
		paddingY={props.verticalPadding ?? 10}
	>
		<LoadingComponent />
	</Box>
);

export default LoadingComponent;
export { WideLoadingComponent };
