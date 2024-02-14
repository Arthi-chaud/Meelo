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

import { Box, Paper, useTheme } from "@mui/material";
import { generateArray } from "../utils/gen-list";

type GradientBackgroundProps = {
	colors: string[] | undefined;
	index?: number;
};

const GradientBackground = ({ colors, index }: GradientBackgroundProps) => {
	const theme = useTheme();
	const [color1, color2, color3, color4, color5] = Array.of(
		...(colors ?? generateArray(5)),
	).sort();
	const gradientCSS = `
		radial-gradient(ellipse at 10% 90%, ${color1} 0%, transparent 55%),
		radial-gradient(ellipse at 90% 90%, ${color2} 0%, transparent 55%),
		radial-gradient(ellipse at 90% 10%, ${color3} 0%, transparent 55%),
		radial-gradient(ellipse at 10% 10%, ${color4} 0%, transparent 55%),
		radial-gradient(ellipse at 0% 100%, ${color5} 0%, transparent 55%);
	`;

	return (
		<>
			<Box
				sx={{
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: -10000 + (index ?? 0),
					width: "100vw",
					height: "100vh",
					background:
						colors && colors.length >= 5 ? gradientCSS : "none",
				}}
			/>
			<Paper
				sx={{
					borderRadius: 0,
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: -10000 + (index ?? 0),
					width: "100vw",
					height: "100vh",
					opacity: 0.5,
					[theme.getColorSchemeSelector("dark")]: {
						opacity: 0.4,
					},
				}}
			/>
		</>
	);
};

export default GradientBackground;
