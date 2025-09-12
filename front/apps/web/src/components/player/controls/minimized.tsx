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

import {
	Box,
	type BoxProps,
	ButtonBase,
	Grid,
	Skeleton,
	Typography,
	useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type IllustrationModel from "@/models/illustration";
import { TrackIcon } from "@/ui/icons";
import { useAccentColor } from "@/utils/accent-color";
import formatArtists from "@/utils/format-artists";
import { useQuery } from "~/api";
import Illustration from "~/components/illustration";
import { useThemedSxValue } from "~/utils/themed-sx-value";
import {
	PlayButton,
	type PlayerControlsProps,
	PreviousButton,
	parentSongQuery,
	playerTextStyle,
	SkipButton,
} from "./common";

const ProgressBar = ({
	progress,
	duration,
	illustration,
	boxProps,
}: Pick<PlayerControlsProps, "progress" | "duration"> & {
	illustration: IllustrationModel | null | undefined;
} & Record<"boxProps", BoxProps>) => {
	const theme = useTheme();
	const accentColorHook = useAccentColor(illustration);
	const [progressState, setProgress] = useState(0);
	const accentColor = useThemedSxValue(
		"borderTopColor",
		accentColorHook?.light,
		accentColorHook?.dark,
	);
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const interval = setInterval(() => {
			const current = progress?.current ?? 0;
			setProgress(current);
		}, 300);

		return () => clearInterval(interval);
	}, [progress]);

	useEffect(() => {
		const targetProgress = !duration ? 0 : (100 * progressState) / duration;

		if (barRef.current) {
			barRef.current.style.width = `${targetProgress}%`;
		}
	}, [progressState, duration]);

	useEffect(() => {
		const current = progress?.current ?? 0;
		setProgress(current);
	}, [progress?.current]);

	if (duration) {
		return (
			<Box
				ref={barRef}
				sx={{
					...boxProps,
					borderRadius: theme.shape.borderRadius,
					borderTop: "3px solid",
					...accentColor,
					width: "0px",
					position: "absolute",
					transition: "width .3s linear",
				}}
			/>
		);
	}

	return null;
};

export const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	const parentSong = useQuery(
		parentSongQuery,
		// The only reason we need the parent song is to get featuring artists
		// We disable the query if we have the featuring already
		props.featuring === undefined
			? (props.track?.songId ?? undefined)
			: undefined,
	);
	const theme = useTheme();
	return (
		<ButtonBase
			onClick={() => props.onExpand(true)}
			disableTouchRipple
			sx={{
				width: "100%",
				height: "100%",
				padding: 0,
				margin: 0,
				position: "relative",
				paddingBottom: "1px",
			}}
		>
			<ProgressBar
				progress={props.progress}
				illustration={props.track?.illustration}
				duration={props.duration}
				boxProps={{
					bottom: -8,
					left: -8,
				}}
			/>
			<Grid
				container
				spacing={1.5}
				sx={{
					alignItems: "center",
					display: "flex",
					width: "100%",
					justifyContent: "center",
					overflow: "hidden",
				}}
			>
				<Grid sx={{ minWidth: "52px" }}>
					{props.track ? (
						<Illustration
							illustration={props.track?.illustration ?? null}
							quality="low"
							fallback={<TrackIcon />}
							imgProps={{ borderRadius: 4 }}
						/>
					) : (
						<Skeleton
							variant="rectangular"
							style={{
								width: "100%",
								height: "100%",
								aspectRatio: "1",
								borderRadius: theme.shape.borderRadius,
							}}
							animation={props.playlistLoading ? "wave" : false}
						/>
					)}
				</Grid>
				<Grid
					container
					size="grow"
					spacing={0.5}
					sx={{
						overflow: "hidden",
						display: "flex",
						alignItems: "space-evenly",
						marginLeft: { xs: 0, sm: 1 },
					}}
				>
					<Grid
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
							{props.track?.name ?? (
								<Skeleton
									animation={
										props.playlistLoading ? "wave" : false
									}
									width={"100px"}
								/>
							)}
						</Typography>
					</Grid>
					<Grid
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
									props.featuring ??
										parentSong.data?.featuring,
								)
							) : (
								<Skeleton
									animation={
										props.playlistLoading ? "wave" : false
									}
									width={"75px"}
								/>
							)}
						</Typography>
					</Grid>
				</Grid>
				<Grid
					container
					size={{ xs: 4, sm: 4, md: 4, lg: 3, xl: 2 }}
					flexWrap="nowrap"
					color={props.playlistLoading ? "text.disabled" : undefined}
					onClick={(event) => event.stopPropagation()}
				>
					<Grid
						size="grow"
						sx={{ display: { xs: "none", sm: "block" } }}
					>
						<PreviousButton onClick={props.onRewind} />
					</Grid>
					<Grid size="grow">
						<PlayButton
							onPause={props.onPause}
							onPlay={props.onPlay}
							isPlaying={props.playing}
						/>
					</Grid>
					<Grid size="grow">
						<SkipButton onClick={props.onSkipTrack} />
					</Grid>
				</Grid>
			</Grid>
		</ButtonBase>
	);
};
