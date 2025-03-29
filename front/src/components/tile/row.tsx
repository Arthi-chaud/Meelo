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

import { Box, Stack } from "@mui/material";
import type Tile from "./";

type TileRowProps = {
	tiles: ReturnType<typeof Tile>[];
	windowSize?: Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", number>>;
};

const TileRow = (props: TileRowProps) => {
	const windowSize = {
		xs: props.windowSize?.xs ?? 2,
		sm: props.windowSize?.sm ?? 3,
		md: props.windowSize?.md ?? 4,
		lg: props.windowSize?.lg ?? 5,
		xl: props.windowSize?.xl ?? 7,
	};
	const width = Object.entries(windowSize).reduce(
		(prev, [key, size]) => ({ ...prev, [key]: `${100 / size}%` }),
		{},
	);

	return (
		<Stack
			sx={{
				overflowX: "scroll",
				paddingBottom: 0,
				width: "100%",
				scrollSnapType: "x",
				paddingTop: 1,
			}}
			direction="row"
		>
			{props.tiles.map((tile, tileIndex) => (
				<Box
					key={tileIndex}
					sx={{
						paddingX: 1,
						minWidth: width,
						maxWidth: width,
						scrollSnapAlign: "start",
					}}
				>
					{tile}
				</Box>
			))}
		</Stack>
	);
};

export default TileRow;
