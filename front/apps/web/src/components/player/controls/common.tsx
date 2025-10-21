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

import { IconButton, Typography, type TypographyProps } from "@mui/material";
import type { ComponentProps, ReactNode } from "react";
import { getSong } from "@/api/queries";
import type Artist from "@/models/artist";
import type { TrackWithRelations } from "@/models/track";
import { ForwardIcon, PauseIcon, PlayIcon, RewindIcon } from "@/ui/icons";
import formatDuration from "@/utils/format-duration";
import type PlayerSlider from "./slider";

export const parentSongQuery = (id: number) =>
	getSong(id, ["artist", "lyrics", "featuring"]);

type PlayerButtonControlsProps = {
	playing: boolean;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
};

export type PlayerControlsProps = ComponentProps<typeof PlayerSlider> &
	PlayerButtonControlsProps & {
		playlistLoading: boolean;
		isTranscoding: boolean;
		expanded: boolean;
		onExpand: (expand: boolean) => void;
		artist?: Artist;
		featuring?: Artist[];
		track?: TrackWithRelations<"illustration">;
	};

export const playerTextStyle = {
	whiteSpace: "nowrap",
};

export type ControlButtonProps = {
	icon: ReactNode;
	onClick: () => void;
};

const ControlButton = (props: ControlButtonProps) => (
	<IconButton onClick={props.onClick} color="inherit">
		{props.icon}
	</IconButton>
);

export const PlayButton = (props: {
	isPlaying: boolean;
	onPause: () => void;
	onPlay: () => void;
}) => (
	<ControlButton
		icon={props.isPlaying ? <PauseIcon /> : <PlayIcon />}
		onClick={props.isPlaying ? props.onPause : props.onPlay}
	/>
);

export const SkipButton = (props: Omit<ControlButtonProps, "icon">) => (
	<ControlButton {...props} icon={<ForwardIcon />} />
);
export const PreviousButton = (props: Omit<ControlButtonProps, "icon">) => (
	<ControlButton {...props} icon={<RewindIcon />} />
);

export const DurationComponent = ({
	time,
	...props
}: { time?: number } & TypographyProps) => (
	<Typography {...props}>{formatDuration(time)}</Typography>
);
