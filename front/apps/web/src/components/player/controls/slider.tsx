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

import { Box, Grid, Slider, useTheme } from "@mui/material";
import { type MutableRefObject, useEffect, useMemo, useState } from "react";
import formatDuration from "@/utils/format-duration";
import { DurationComponent } from "./common";

type PlayerSliderProps = {
	onSlide: (newProgress: number) => void;
	duration?: number;
	progress?: MutableRefObject<number | null>;
};

const PlayerSlider = (props: PlayerSliderProps) => {
	const [progress, setProgress] = useState<null | number>(
		props.progress?.current ?? null,
	);
	const theme = useTheme();
	const progressMaxWidth = useMemo(() => {
		return `calc(${formatDuration(props.duration).length} * 1rem)`;
	}, [props.duration, theme]);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress(props.progress?.current ?? null);
		}, 500);
		return () => clearInterval(interval);
	}, []);
	return (
		<Grid
			container
			sx={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				color:
					props.duration === undefined ? "text.disabled" : undefined,
			}}
		>
			<Grid
				size="auto"
				style={{
					width: progressMaxWidth,
				}}
			>
				<DurationComponent
					style={{ textAlign: "center" }}
					time={progress ?? undefined}
				/>
			</Grid>
			<Grid size="grow" sx={{ display: "flex", alignItems: "center" }}>
				<Slider
					style={{
						paddingBottom: 0,
						height: 7,
					}}
					slotProps={{
						track: {
							style: {
								height: 5,
								minWidth: 5,
								transition: "width .2s ease-in",
								// Note: It overflows at the border at the very end of the track
								// not worth trying to figure  out
								// borderStartEndRadius: 0,
								// borderEndEndRadius: 0,
							},
						},
						rail: { style: { opacity: 0.2 } },
					}}
					// removing the thumb by overriding it with a dummy component
					slots={{ thumb: Box }}
					disabled={!props.duration}
					color="secondary"
					valueLabelDisplay="off"
					onChange={(event) => {
						if (props.duration !== undefined) {
							const target: any = event.target;
							const newProgress =
								(target.value / 100) * props.duration;

							setProgress(newProgress);
							props.onSlide(newProgress);
						}
					}}
					value={
						props.duration && progress !== null
							? (progress * 100) /
								(props.duration === 0
									? progress
									: props.duration)
							: 0
					}
				/>
			</Grid>
			<Grid
				size="auto"
				style={{
					width: progressMaxWidth,
				}}
			>
				<DurationComponent
					style={{ textAlign: "center" }}
					time={props.duration ?? undefined}
				/>
			</Grid>
		</Grid>
	);
};

export default PlayerSlider;
