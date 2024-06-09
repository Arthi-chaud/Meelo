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
	CloseIcon,
	ContextualMenuIcon,
	DragHandleIcon,
	ForwardIcon,
	FullscreenIcon,
	PauseIcon,
	PlayIcon,
	RewindIcon,
	TrackIcon,
} from "../icons";
import {
	Box,
	Button,
	ButtonBase,
	Container,
	Divider,
	Grid,
	IconButton,
	Skeleton,
	Stack,
	Tab,
	Tabs,
	Typography,
	useTheme,
} from "@mui/material";
import Illustration from "../illustration";
import { LegacyRef, useState } from "react";
import PlayerSlider from "./controls/slider";
import API from "../../api/api";
import { useQuery } from "../../api/use-query";
import LyricsBox from "../lyrics";
import Track from "../../models/track";
import Artist from "../../models/artist";
import Link from "next/link";
import ReleaseTrackContextualMenu from "../contextual-menu/release-track-contextual-menu";
import Release from "../../models/release";
import ListItem from "../list-item/item";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import formatDuration from "../../utils/formatDuration";
import formatArtists from "../../utils/formatArtists";
import { useTranslation } from "react-i18next";
import { usePlayerContext } from "../../contexts/player";

const parentSongQuery = (id: number) =>
	API.getSong(id, ["artist", "lyrics", "featuring"]);

type PlayerButtonControlsProps = {
	playing: boolean;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
};

type PlayerControlsProps = Parameters<typeof PlayerSlider>[number] &
	PlayerButtonControlsProps & {
		expanded: boolean;
		onExpand: (expand: boolean) => void;
		artist?: Artist;
		track?: Track;
		release?: Release;
	};

const playerTextStyle = {
	whiteSpace: "nowrap",
};

type ControlButtonProps = {
	icon: JSX.Element;
	onClick: () => void;
};

const ControlButton = (props: ControlButtonProps) => (
	<IconButton onClick={props.onClick} color="inherit">
		{props.icon}
	</IconButton>
);

const PlayButton = (props: {
	isPlaying: boolean;
	onPause: () => void;
	onPlay: () => void;
}) => (
	<ControlButton
		icon={props.isPlaying ? <PauseIcon /> : <PlayIcon />}
		onClick={props.isPlaying ? props.onPause : props.onPlay}
	/>
);
const SkipButton = (props: Omit<ControlButtonProps, "icon">) => (
	<ControlButton {...props} icon={<ForwardIcon />} />
);
const PreviousButton = (props: Omit<ControlButtonProps, "icon">) => (
	<ControlButton {...props} icon={<RewindIcon />} />
);
const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	const parentSong = useQuery(parentSongQuery, props.track?.songId);

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

const Panels = ["lyrics", "playlist"] as const;

const ExpandedPlayerControls = (
	props: PlayerControlsProps & { videoRef: LegacyRef<HTMLVideoElement> },
) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const parentSong = useQuery(parentSongQuery, props.track?.songId);
	const [panel, setPanel] = useState<(typeof Panels)[number]>("lyrics");
	const { playlist, cursor, reorder, skipTrack } = usePlayerContext();
	const requestFullscreen = () => {
		const el: any = document.getElementById("videoPlayer");

		if (el.requestFullscreen) {
			el.requestFullscreen();
		} else if (el.msRequestFullscreen) {
			el.msRequestFullscreen();
		} else if (el.mozRequestFullScreen) {
			el.mozRequestFullScreen();
		} else if (el.webkitRequestFullscreen) {
			el.webkitRequestFullscreen();
		} else if (el.webkitEnterFullscreen) {
			el.webkitEnterFullscreen();
		} else if (el.enterFullscreen) {
			el.enterFullscreen();
		}
	};

	return (
		<Stack
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				padding: 1,
				overflowY: { xs: "auto", lg: "clip" },
				overflowX: "clip",
			}}
			direction="column"
		>
			<Box
				sx={{
					alignSelf: "flex-end",
					margin: 1,
					position: "sticky",
					top: 2,
					zIndex: "modal",
				}}
			>
				<IconButton onClick={() => props.onExpand(false)}>
					<CloseIcon />
				</IconButton>
			</Box>
			<Grid container>
				<Grid
					item
					container
					xs={12}
					lg={7}
					sx={{
						height: { xs: "80vh", lg: "90vh" },
						flexWrap: "nowrap",
						justifyContent: { lg: "center" },
					}}
					direction="column"
				>
					<Grid
						item
						xs={7}
						sx={{
							padding: 3,
							overflow: "hidden",
							display: "flex",
							justifyContent: "center",
						}}
					>
						{props.track?.type == "Video" ? (
							<video
								playsInline
								id="videoPlayer"
								ref={props.videoRef}
								disablePictureInPicture={false}
								style={{
									borderRadius: theme.shape.borderRadius,
								}}
								onClick={requestFullscreen}
							/>
						) : (
							<Box
								sx={{
									height: "100%",
									aspectRatio: "1",
									objectFit: "contain",
									overflow: "hidden",
								}}
							>
								<Illustration
									quality="original"
									illustration={
										props.track?.illustration ?? null
									}
									fallback={<TrackIcon />}
								/>
							</Box>
						)}
					</Grid>
					<Grid item sx={{ width: "100%" }}>
						<Stack
							spacing={2}
							sx={{ justifyContent: "space-evenly" }}
						>
							<Grid
								container
								sx={{
									...playerTextStyle,
									width: "100%",
									flexGrow: 1,
									display: "flex",
									justifyContent: "center",
								}}
							>
								<Grid
									item
									xs={1}
									sx={{
										display: "flex",
										justifyContent: "end",
									}}
								>
									{props.track?.type == "Video" && (
										<IconButton onClick={requestFullscreen}>
											<FullscreenIcon />
										</IconButton>
									)}
								</Grid>
								<Grid
									item
									xs={10}
									sx={{
										...playerTextStyle,
										display: "flex",
										justifyContent: "center",
									}}
								>
									{props.artist && props.track ? (
										<Link
											href={`/releases/${props.track.releaseId}`}
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
											}}
										>
											<Button
												onClick={() =>
													props.onExpand(false)
												}
												sx={{
													textTransform: "none",
													color: "inherit",
													width: "100%",
												}}
											>
												<Typography
													sx={{
														fontWeight: "bold",
														...playerTextStyle,
													}}
												>
													{props.track?.name}
												</Typography>
											</Button>
										</Link>
									) : (
										<Skeleton
											animation={false}
											width={"70%"}
										/>
									)}
								</Grid>
								<Grid item xs={1}>
									{
										props.track &&
										parentSong.data &&
										props.artist ? (
											<ReleaseTrackContextualMenu
												artist={props.artist}
												track={{
													...props.track,
													song: parentSong.data,
												}}
												onSelect={() =>
													props.onExpand(false)
												}
											/>
										) : (
											<IconButton>
												<ContextualMenuIcon />
											</IconButton>
										)

										// To avoid slight shift on loaded
									}
								</Grid>
							</Grid>
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
								}}
							>
								{props.track && props.artist ? (
									<Link
										href={`/artists/${props.artist.slug}`}
										style={{
											overflow: "hidden",
											textOverflow: "ellipsis",
										}}
									>
										<Button
											onClick={() =>
												props.onExpand(false)
											}
											sx={{
												textTransform: "none",
												color: "inherit",
												width: "100%",
											}}
										>
											<Typography
												sx={{ ...playerTextStyle }}
											>
												{formatArtists(
													props.artist,
													parentSong.data?.featuring,
												)}
											</Typography>
										</Button>
									</Link>
								) : (
									<Skeleton
										animation={false}
										sx={{ margin: 1 }}
										width={"50%"}
									/>
								)}
							</Box>
							<Stack
								spacing={2}
								sx={{
									justifyContent: "center",
									display: "flex",
								}}
								direction="row"
							>
								<PreviousButton onClick={props.onRewind} />
								<PlayButton
									onPause={props.onPause}
									onPlay={props.onPlay}
									isPlaying={props.playing}
								/>
								<SkipButton onClick={props.onSkipTrack} />
							</Stack>
							<Container maxWidth={false}>
								<PlayerSlider
									onSlide={props.onSlide}
									duration={props.duration}
									progress={props.progress}
								/>
							</Container>
						</Stack>
					</Grid>
				</Grid>
				<Grid item xs={12} lg={5}>
					<Container maxWidth={false}>
						<Tabs
							value={panel}
							onChange={(__, panelName) => setPanel(panelName)}
							variant="fullWidth"
						>
							{Panels.map((tabName, index) => (
								<Tab
									key={index}
									value={tabName}
									label={t(tabName)}
								/>
							))}
						</Tabs>
						<Box
							sx={{
								paddingY: 2,
								height: { xs: "100%", lg: "80vh" },
								overflowY: "scroll",
							}}
						>
							{panel == "lyrics" && (
								<LyricsBox
									lyrics={
										parentSong.data
											? parentSong.data.lyrics?.content.split(
													"\n",
												) ?? null
											: undefined
									}
									songName={props.track?.name}
								/>
							)}
							{panel == "playlist" && (
								<DragDropContext
									onDragEnd={(result) => {
										if (result.destination) {
											reorder({
												from:
													result.source.index +
													cursor +
													1,
												to:
													result.destination.index +
													cursor +
													1,
											});
										}
									}}
								>
									<Droppable droppableId="droppable">
										{(provided) => (
											<div
												{...provided.droppableProps}
												ref={provided.innerRef}
											>
												{playlist
													.slice(cursor + 1)
													.map(
														(
															playlistItem,
															index,
														) => (
															<>
																<Draggable
																	draggableId={index.toString()}
																	key={index}
																	index={
																		index
																	}
																>
																	{(
																		providedChild,
																	) => (
																		<div
																			ref={
																				providedChild.innerRef
																			}
																			{...providedChild.draggableProps}
																			style={
																				providedChild
																					.draggableProps
																					.style
																			}
																		>
																			<ListItem
																				title={
																					playlistItem
																						.track
																						.name
																				}
																				secondTitle={
																					playlistItem
																						.artist
																						.name
																				}
																				icon={
																					<Box
																						{...providedChild.dragHandleProps}
																					>
																						<DragHandleIcon />
																					</Box>
																				}
																				trailing={
																					<Typography color="text.disabled">
																						{formatDuration(
																							playlistItem
																								.track
																								.duration,
																						)}
																					</Typography>
																				}
																				onClick={() => {
																					let toSkip =
																						index +
																						1;

																					while (
																						toSkip >
																						0
																					) {
																						skipTrack();
																						toSkip--;
																					}
																				}}
																			/>
																		</div>
																	)}
																</Draggable>
																<Divider variant="middle" />
															</>
														),
													)}
												{provided.placeholder}
											</div>
										)}
									</Droppable>
								</DragDropContext>
							)}
						</Box>
					</Container>
				</Grid>
			</Grid>
		</Stack>
	);
};

export { MinimizedPlayerControls, ExpandedPlayerControls };
