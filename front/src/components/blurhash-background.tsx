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

import { Box, useTheme } from "@mui/material";
import hexToRgba from "hex-to-rgba";
import Blurhash from "./blurhash";

const BackgroundBlurhash = (props: { blurhash?: string }) => {
	const theme = useTheme();
	const fadeIn = {
		opacity: 1,
		animation: `fadeIn 0.${theme.transitions.duration.enteringScreen}ms ${theme.transitions.easing.easeIn} 0ms`,
		"@keyframes fadeIn": { "0%": { opacity: 0 } },
	};

	return (
		<>
			<Blurhash
				blurhash={props.blurhash}
				sx={{
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: -10000,
					width: "100vw",
					height: "100vh",
					...fadeIn,
				}}
			/>
			<Box
				sx={{
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: -10000,
					width: "100vw",
					height: "100vh",
					background: hexToRgba(
						theme.palette.background.default,
						0.6,
					),
				}}
			/>
		</>
	);
};

export default BackgroundBlurhash;
