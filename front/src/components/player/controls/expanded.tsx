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
	Button,
	Container,
	Dialog,
	Divider,
	Grid,
	IconButton,
	Skeleton,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { useAtom, useSetAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import { type LegacyRef, useCallback, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import API from "~/api";
import { useQuery, useQueryClient } from "~/api/use-query";
import { CreatePlaylistAction } from "~/components/actions/playlist";
import ReleaseTrackContextualMenu from "~/components/contextual-menu/resource/release-track";
import {
	CloseIcon,
	ContextualMenuIcon,
	DeleteIcon,
	DragHandleIcon,
	FullscreenIcon,
	LyricsIcon,
	PlayerIcon,
	PlaylistIcon,
	TrackIcon,
} from "~/components/icons";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";
import {
	cursorAtom,
	playlistAtom,
	removeTrackAtom,
	reorderAtom,
	skipTrackAtom,
} from "~/state/player";
import formatArtists from "~/utils/formatArtists";
import formatDuration from "~/utils/formatDuration";
import {
	PlayButton,
	type PlayerControlsProps,
	PreviousButton,
	SkipButton,
	parentSongQuery,
	playerTextStyle,
} from "./common";
import { LyricsComponent } from "./lyrics";
import PlayerSlider from "./slider";

export const ExpandedPlayerControls = (
	props: PlayerControlsProps & { videoRef: LegacyRef<HTMLVideoElement> },
) => {
	const theme = useTheme();
	const parentSong = useQuery(
		parentSongQuery,
		props.track?.songId ?? undefined,
	);
	const queryClient = useQueryClient();
	const [playlist] = useAtom(playlistAtom);
	const [cursor] = useAtom(cursorAtom);
	const [playlistModalIsOpen, openPlaylistModal] = useState(false);
	const skipTrack = useSetAtom(skipTrackAtom);
	const removeTrack = useSetAtom(removeTrackAtom);
	const reorder = useSetAtom(reorderAtom);
	const [selectedTab, selectTab] = useState<"player" | "lyrics" | "playlist">(
		"player",
	);
	const { t } = useTranslation();
	const router = useRouter();

	const saveAsPlaylistAction = CreatePlaylistAction(
		queryClient,
		async (playlistId) => {
			try {
				for (const s of playlist) {
					if (s.track.songId) {
						await API.addSongToPlaylist(s.track.songId, playlistId);
					}
				}
				router.push(`/playlists/${playlistId}`);
			} catch {
				toast.error(t("errorOccured"));
			}
		},
	);
	const requestFullscreen = useCallback(() => {
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
	}, []);

	return (
		<Stack
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				padding: 1,
				overflowX: "clip",
				overflowY: "auto",
				paddingBottom: 2,
			}}
			direction="column"
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					margin: 1,
					alignItems: "start",
				}}
			>
				<Box />
				<Box
					sx={{
						flexDirection: "row",
						display: "flex",
					}}
				>
					{selectedTab !== "player" && props.track && props.artist ? (
						<>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Typography
									variant="h6"
									sx={{ textAlign: "center" }}
								>
									{props.track.name}
								</Typography>
								<Typography
									variant="body1"
									sx={{ textAlign: "center" }}
								>
									{formatArtists(
										props.artist,
										parentSong.data?.featuring,
									)}
								</Typography>
							</Box>
						</>
					) : (
						<></>
					)}
				</Box>
				<IconButton onClick={() => props.onExpand(false)}>
					<CloseIcon />
				</IconButton>
			</Box>
			{selectedTab !== "player" && (
				<Divider sx={{ margin: 1, marginBottom: 0 }} variant="middle" />
			)}

			<Grid
				container
				sx={
					selectedTab !== "player"
						? { width: 0, height: 0, overflow: "hidden" }
						: {
								height: "100%",
								minHeight: "500px",
								flexWrap: "nowrap",
								justifyContent: "center",
								alignSelf: "center",
								maxWidth: theme.breakpoints.values.md,
							}
				}
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
					{props.track?.type === "Video" ? (
						// biome-ignore lint/a11y/useMediaCaption: No caption available
						// biome-ignore lint/a11y/useKeyWithClickEvents: TODO?
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
								illustration={props.track?.illustration ?? null}
								fallback={<TrackIcon />}
							/>
						</Box>
					)}
				</Grid>
				<Grid item sx={{ width: "100%" }}>
					<Stack spacing={3}>
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
								{props.track?.type === "Video" && (
									<IconButton onClick={requestFullscreen}>
										<FullscreenIcon size={18} />
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
										href={
											props.track.releaseId
												? `/releases/${props.track.releaseId}`
												: props.track.songId
													? `/songs/${props.track.songId}/lyrics`
													: {}
										}
										style={{
											overflow: "hidden",
											textOverflow: "ellipsis",
										}}
									>
										<Button
											onClick={() =>
												props.track &&
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
									<Skeleton animation={false} width={"70%"} />
								)}
							</Grid>
							<Grid item xs={1}>
								{
									props.track && props.artist ? (
										<ReleaseTrackContextualMenu
											artist={props.artist}
											track={{
												...props.track,
												song: props.track.songId
													? (parentSong.data ?? null)
													: null,
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
										onClick={() => props.onExpand(false)}
										sx={{
											textTransform: "none",
											color: "inherit",
											width: "100%",
										}}
									>
										<Typography sx={{ ...playerTextStyle }}>
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
			{selectedTab === "lyrics" && (
				<Box
					sx={{
						height: "100%",
						width: "100%",
						overflowY: "scroll",
						marginLeft: 2,
						paddingRight: 3,
						alignSelf: "center",
						maxWidth: theme.breakpoints.values.md,
					}}
				>
					<LyricsComponent
						lyrics={parentSong.data?.lyrics}
						songName={props.track?.name}
						progress={props.progress}
						setProgress={props.onSlide}
						playerIsExpanded={props.expanded}
					/>
				</Box>
			)}
			{selectedTab === "playlist" && (
				<>
					<Box
						sx={{
							height: "100%",
							width: "100%",
							overflowY: "scroll",
							alignSelf: "center",
							maxWidth: theme.breakpoints.values.md,
						}}
					>
						<DragDropContext
							onDragEnd={(result) => {
								if (result.destination) {
									reorder({
										from: result.source.index + cursor + 1,
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
											.map((playlistItem, index) => (
												<>
													<Draggable
														draggableId={index.toString()}
														key={index}
														index={index}
													>
														{(providedChild) => (
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
																		<Grid
																			container
																			wrap="nowrap"
																			columnSpacing={
																				1
																			}
																		>
																			<Grid
																				item
																				sx={{
																					display:
																						"flex",
																					alignItems:
																						"center",
																				}}
																			>
																				<Typography color="text.disabled">
																					{formatDuration(
																						playlistItem
																							.track
																							.duration,
																					)}
																				</Typography>
																			</Grid>
																			<Grid
																				item
																			>
																				<IconButton
																					size={
																						"small"
																					}
																					onClick={() =>
																						removeTrack(
																							cursor +
																								1 +
																								index,
																						)
																					}
																				>
																					<DeleteIcon />
																				</IconButton>
																			</Grid>
																		</Grid>
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
													<Divider
														key={`divider-${index}`}
														variant="middle"
													/>
												</>
											))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					</Box>

					{playlist.length > 0 && (
						<Button
							sx={{
								width: "100%",
								alignSelf: "center",
								marginTop: 1,
								maxWidth: theme.breakpoints.values.md,
							}}
							variant="outlined"
							onClick={() => {
								props.onExpand(false);
								openPlaylistModal(true);
							}}
						>
							Save queue as playlist
						</Button>
					)}
				</>
			)}

			<Dialog
				open={playlistModalIsOpen}
				onClose={() => openPlaylistModal(false)}
				fullWidth
			>
				{saveAsPlaylistAction.dialog!({
					close: () => openPlaylistModal(false),
				})}
			</Dialog>
			<Divider
				variant="middle"
				sx={{
					margin: 1,
					marginBottom: 2,
					marginTop: selectedTab === "lyrics" ? 0 : undefined,
				}}
			/>
			<Grid
				container
				sx={{
					width: "100%",
					justifyContent: "space-evenly",
				}}
			>
				{[
					["player", PlayerIcon] as const,
					["lyrics", LyricsIcon] as const,
					["playlist", PlaylistIcon] as const,
				].map(([tabName, Icon], index) => (
					<IconButton
						key={index}
						disabled={
							tabName === "lyrics" && !parentSong.data?.lyrics
						}
						style={{
							transition: "color 0.2s ease",
						}}
						onClick={() =>
							selectTab((s) =>
								s === tabName ? "player" : tabName,
							)
						}
					>
						<Icon
							variant={
								selectedTab === tabName ? "Bold" : undefined
							}
						/>
					</IconButton>
				))}
			</Grid>
		</Stack>
	);
};
