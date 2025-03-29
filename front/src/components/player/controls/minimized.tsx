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

import { Box, ButtonBase, Grid, Typography } from "@mui/material";
import { useQuery } from "api/use-query";
import { TrackIcon } from "components/icons";
import Illustration from "components/illustration";
import formatArtists from "utils/formatArtists";
import {
	PlayButton,
	type PlayerControlsProps,
	SkipButton,
	parentSongQuery,
	playerTextStyle,
} from "./common";

export const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	const parentSong = useQuery(
		parentSongQuery,
		props.track?.songId ?? undefined,
	);

	return (
		<ButtonBase
			onClick={() => props.onExpand(true)}
			disableTouchRipple
			sx={{ width: "100%", height: "100%", padding: 0, margin: 0 }}
		>
			<Grid
				container
				spacing={1}
				sx={{
					alignItems: "center",
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Grid item sx={{ minWidth: "60px" }}>
					{props.track ? (
						<Illustration
							illustration={props.track?.illustration ?? null}
							quality="low"
							fallback={<TrackIcon />}
							imgProps={{ borderRadius: 4 }}
						/>
					) : (
						<Box
							sx={{
								height: "100%",
								display: "flex",
								marginX: 2,
								alignItems: "center",
							}}
						>
							<TrackIcon />
						</Box>
					)}
				</Grid>
				<Grid
					item
					container
					xs
					spacing={0.5}
					sx={{
						overflow: "hidden",
						display: "flex",
						alignItems: "space-evenly",
						marginLeft: { xs: 0, sm: 1 },
					}}
				>
					<Grid
						item
						sx={{
							width: "100%",
							display: "flex",
							...playerTextStyle,
							justifyContent: "left",
						}}
					>
						<Typography
							sx={{ fontWeight: "bold", ...playerTextStyle }}
						>
							{props.track?.name ?? <br />}
						</Typography>
					</Grid>
					<Grid
						item
						sx={{
							display: "flex",
							width: "100%",
							...playerTextStyle,
							justifyContent: "left",
						}}
					>
						<Typography
							sx={{
								color: "text.disabled",
								...playerTextStyle,
								fontSize: "medium",
							}}
						>
							{props.artist ? (
								formatArtists(
									props.artist,
									parentSong.data?.featuring,
								)
							) : (
								<br />
							)}
						</Typography>
					</Grid>
				</Grid>
				<Grid
					item
					container
					xs={4}
					sm={3}
					md={2}
					flexWrap="nowrap"
					onClick={(event) => event.stopPropagation()}
				>
					<Grid item xs>
						<PlayButton
							onPause={props.onPause}
							onPlay={props.onPlay}
							isPlaying={props.playing}
						/>
					</Grid>
					<Grid item xs>
						<SkipButton onClick={props.onSkipTrack} />
					</Grid>
				</Grid>
			</Grid>
		</ButtonBase>
	);
};
