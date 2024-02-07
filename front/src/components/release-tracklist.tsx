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
	Divider,
	Icon,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Skeleton,
	Typography,
	useTheme,
} from "@mui/material";
import Release from "../models/release";
import Track from "../models/track";
import Tracklist from "../models/tracklist";
import Artist from "../models/artist";
import formatDuration from "../utils/formatDuration";
import ReleaseTrackContextualMenu from "./contextual-menu/release-track-contextual-menu";
import { SongWithRelations } from "../models/song";
import { VideoIcon } from "./icons";
import formatArtists from "../utils/formatArtists";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import { generateArray } from "../utils/gen-list";
import { usePlayerContext } from "../contexts/player";

type ReleaseTracklistProps = {
	mainArtist: Artist | undefined | null;
	tracklist:
		| Tracklist<Track & { song: SongWithRelations<"artist" | "featuring"> }>
		| undefined;
	release: Release | undefined;
};

/**
 * Interactive tracklist for a release
 */
const ReleaseTrackList = ({
	tracklist,
	release,
	mainArtist,
}: ReleaseTracklistProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { playTracks } = usePlayerContext();
	const flatTracklist = tracklist
		? Array.from(Object.values(tracklist)).flat()
		: undefined;
	const formatTracksubtitle = (
		song: SongWithRelations<"artist" | "featuring">,
	) => {
		if (song.artistId === mainArtist?.id && song.featuring?.length === 0) {
			return undefined;
		}
		return formatArtists(song.artist, song.featuring);
	};

	return (
		<Box>
			{Array.from(
				Object.entries(
					tracklist ??
						({
							"": generateArray(12),
						} as Tracklist<undefined>),
				),
			).map((disc, __, discs) => (
				<List
					key={disc[0]}
					subheader={
						discs.length !== 1 && (
							<ListSubheader disableSticky>
								{`${t("disc")} ${disc[0]}`}
							</ListSubheader>
						)
					}
				>
					{(
						disc[1] as (
							| (Track & {
									song: SongWithRelations<
										"artist" | "featuring"
									>;
							  })
							| undefined
						)[]
					).map((currentTrack, index) => (
						<Fragment key={index}>
							<ListItem
								dense={
									currentTrack
										? currentTrack.song.artistId !=
											mainArtist?.id
										: false
								}
								disablePadding
								disableGutters
								secondaryAction={
									currentTrack &&
									release && (
										<ReleaseTrackContextualMenu
											track={currentTrack}
											artist={currentTrack.song.artist}
											release={release}
										/>
									)
								}
							>
								<ListItemButton
									onClick={
										flatTracklist &&
										currentTrack &&
										release &&
										(() =>
											playTracks({
												tracks: flatTracklist.map(
													(flatTrack) => ({
														track: flatTrack,
														release,
														artist: flatTrack.song
															.artist,
													}),
												),
												cursor: flatTracklist.findIndex(
													(flatTrack) =>
														flatTrack.id ==
														currentTrack.id,
												),
											}))
									}
									sx={{
										borderTopRightRadius: 0,
										borderBottomRightRadius: 0,
									}}
								>
									<ListItemIcon>
										<Typography color="text.disabled">
											{currentTrack?.trackIndex ?? (
												<Skeleton width="30px" />
											)}
										</Typography>
									</ListItemIcon>
									<ListItemText
										primary={
											currentTrack?.name ?? (
												<Skeleton width="100%" />
											)
										}
										primaryTypographyProps={{
											fontSize: "medium",
										}}
										secondary={
											currentTrack
												? formatTracksubtitle(
														currentTrack.song,
													)
												: undefined
										}
										secondaryTypographyProps={{
											fontSize: "small",
											color: "text.disabled",
										}}
									/>
									{currentTrack?.isBonus && (
										<Typography
											sx={{
												display: {
													xs: "none",
													sm: "block",
												},
											}}
											color="text.disabled"
										>
											{t("bonusTrack")}
										</Typography>
									)}
									{currentTrack?.isRemastered && (
										<Typography
											color="text.disabled"
											sx={{
												display: {
													xs: "none",
													sm: "block",
												},
											}}
										>
											{t("remastered")}
										</Typography>
									)}
									{currentTrack?.type == "Video" && (
										<Icon
											sx={{
												marginLeft: 2,
												display: "flex",
												alignItems: "center",
											}}
										>
											<VideoIcon
												color={
													theme.palette.text.disabled
												}
											/>
										</Icon>
									)}
									<Typography
										color="text.disabled"
										sx={{
											marginLeft: 2,
											overflow: "unset",
										}}
									>
										{currentTrack ? (
											formatDuration(
												currentTrack.duration,
											)
										) : (
											<Skeleton width="30px" />
										)}
									</Typography>
								</ListItemButton>
							</ListItem>
							<Divider variant="inset" />
						</Fragment>
					))}
				</List>
			))}
		</Box>
	);
};

export default ReleaseTrackList;
