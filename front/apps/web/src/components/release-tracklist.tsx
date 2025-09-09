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
	IconButton,
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
import { useAtom, useSetAtom } from "jotai";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RequireAtLeastOne } from "type-fest";
import type Artist from "@/models/artist";
import type { ReleaseWithRelations } from "@/models/release";
import type { SongWithRelations } from "@/models/song";
import type { TrackWithRelations } from "@/models/track";
import type Tracklist from "@/models/tracklist";
import type { VideoWithRelations } from "@/models/video";
import {
	cursorAtom,
	playlistAtom,
	playTracksAtom,
	type TrackState,
} from "@/state/player";
import { ContextualMenuIcon, PlayIcon, VideoIcon } from "@/ui/icons";
import formatArtists from "@/utils/format-artists";
import formatDuration from "@/utils/format-duration";
import { generateArray } from "@/utils/gen-list";
import ReleaseTrackContextualMenu from "~/components/contextual-menu/resource/release-track";

type TrackType = TrackWithRelations<"illustration"> &
	RequireAtLeastOne<{
		song: SongWithRelations<"artist" | "featuring">;
		video: VideoWithRelations<"artist">;
	}>;
type ReleaseTracklistProps = {
	mainArtist: Artist | undefined | null;
	tracklist: Tracklist<TrackType> | undefined;
	release: ReleaseWithRelations<"discs"> | undefined;
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
	const PlayingIcon = () => (
		<PlayIcon
			style={{
				fill: theme.vars.palette.text.disabled,
				color: "transparent",
				marginLeft: -4,
			}}
		/>
	);
	const [playlist] = useAtom(playlistAtom);
	const [cursor] = useAtom(cursorAtom);
	const playTracks = useSetAtom(playTracksAtom);
	const currentlyPlayingTrack = useMemo(
		() => playlist[cursor] as TrackState | undefined,
		[playlist, cursor],
	);
	const flatTracklist = tracklist
		? Array.from(Object.values(tracklist)).flat()
		: undefined;
	const formatTracksubtitle = (song: {
		artistId: number;
		artist: Artist;
		featuring?: Artist[];
	}) => {
		if (song.artistId === mainArtist?.id && !song.featuring?.length) {
			return undefined;
		}
		return formatArtists(song.artist, song.featuring, mainArtist);
	};
	// Note, at this point disc index is a string /shrug
	const formatDisc = (discIndex: string) => {
		const disc = release?.discs.find((d) =>
			d.index === null
				? discIndex === "?"
				: d.index.toString() === discIndex,
		);
		const base = `${t("models.disc")} ${discIndex}`;
		if (disc?.name) {
			return `${base} — ${disc.name}`;
		}
		return base;
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
							<ListSubheader
								disableSticky
								sx={{
									padding: 0,
									width: "100%",
									overflow: "hidden",
								}}
							>
								<ListItemButton
									onClick={
										tracklist &&
										release &&
										(() =>
											playTracks({
												tracks: disc[1].map(
													(flatTrack: TrackType) => ({
														track: flatTrack,
														release,
														artist: (flatTrack.song ??
															flatTrack.video)!
															.artist,
													}),
												),
												cursor: 0,
											}))
									}
									sx={{
										lineHeight: 3,
										borderRadius: 0,
										paddingY: 0,
										width: "100%",
										textAlign: "left",
										display: "block",
										textTransform: "none",
										textWrap: "nowrap",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{formatDisc(disc[0])}{" "}
								</ListItemButton>
							</ListSubheader>
						)
					}
				>
					{(disc[1] as (TrackType | undefined)[]).map(
						(currentTrack, index) => (
							<Fragment key={index}>
								<ListItem
									dense={
										mainArtist === undefined
											? false
											: currentTrack
												? (currentTrack.song ??
														currentTrack.video)!
														.artistId !==
													mainArtist?.id
												: false
									}
									disablePadding
									disableGutters
									secondaryAction={
										currentTrack ? (
											<ReleaseTrackContextualMenu
												track={{
													...currentTrack,
													song:
														currentTrack.song ??
														null,
												}}
												artist={
													(currentTrack.song ??
														currentTrack.video)!
														.artist
												}
											/>
										) : (
											<IconButton disabled>
												<ContextualMenuIcon />
											</IconButton>
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
															artist: (flatTrack.song ??
																flatTrack.video)!
																.artist,
														}),
													),
													cursor: flatTracklist.findIndex(
														(flatTrack) =>
															flatTrack.id ===
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
											{currentTrack ? (
												currentTrack.id ===
												currentlyPlayingTrack?.track
													.id ? (
													<PlayingIcon />
												) : currentTrack?.type ===
													"Video" ? (
													<Icon
														sx={{
															display: "flex",
															marginLeft: -0.5,
														}}
													>
														<VideoIcon
															color={
																theme.vars
																	.palette
																	.text
																	.disabled
															}
														/>
													</Icon>
												) : (
													<Typography color="text.disabled">
														{
															currentTrack.trackIndex
														}
													</Typography>
												)
											) : (
												<Skeleton
													width="20px"
													sx={{
														color: "text.disabled",
													}}
												/>
											)}
										</ListItemIcon>
										<ListItemText
											primary={
												currentTrack ? (
													currentTrack.name
												) : (
													<Skeleton width="120px" />
												)
											}
											slotProps={{
												primary: {
													fontSize: "medium",
													component: "div",
												},
												secondary: {
													fontSize: "small",
													color: "text.disabled",
												},
											}}
											secondary={
												mainArtist === undefined
													? null
													: currentTrack
														? formatTracksubtitle(
																(currentTrack.song ??
																	currentTrack.video)!,
															)
														: undefined
											}
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
												{t("track.bonusTrack")}
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
												{t("track.remastered")}
											</Typography>
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
						),
					)}
				</List>
			))}
		</Box>
	);
};

export default ReleaseTrackList;
