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

import { Grid, Slider } from "@mui/material";
import { type MutableRefObject, useEffect, useState } from "react";
import DurationComponent from "./duration";

type PlayerSliderProps = {
	onSlide: (newProgress: number) => void;
	duration?: number;
	progress?: MutableRefObject<number | null>;
};

const PlayerSlider = (props: PlayerSliderProps) => {
	const [progress, setProgress] = useState<null | number>(
		props.progress?.current ?? null,
	);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress(props.progress?.current ?? null);
		}, 500);
		return () => clearInterval(interval);
	}, []);
	return (
		<Grid
			container
			spacing={2}
			sx={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				color:
					props.duration === undefined ? "text.disabled" : undefined,
			}}
		>
			<Grid item xs="auto">
				<DurationComponent time={progress ?? undefined} />
			</Grid>
			<Grid item xs>
				<Slider
					style={{ paddingBottom: 0 }}
					disabled={!props.duration || progress === null}
					size="small"
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
			<Grid item xs="auto">
				<DurationComponent time={props.duration ?? undefined} />
			</Grid>
		</Grid>
	);
};

export default PlayerSlider;
