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
	Grow,
	Paper,
	Slide,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { type LegacyRef, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import API from "../../api/api";
import type { RootState } from "../../state/store";
import { ExpandedPlayerControls, MinimizedPlayerControls } from "./controls";
import { toast } from "react-hot-toast";
import { DrawerBreakpoint } from "../scaffold/scaffold";
import { useTranslation } from "react-i18next";
import { useReadLocalStorage } from "usehooks-ts";
import { usePlayerContext } from "../../contexts/player";
import Hls from "hls.js";
import { v4 as uuidv4 } from "uuid";
import { useKeyboardBinding } from "../../contexts/keybindings";

const Player = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const userIsAuthentified = useSelector(
		(state: RootState) => state.user.user !== undefined,
	);
	const { playPreviousTrack, playTracks, skipTrack, cursor, playlist } =
		usePlayerContext();
	const currentTrack = useMemo(() => playlist[cursor], [cursor, playlist]);
	const player = useRef<HTMLAudioElement | HTMLVideoElement>();
	const audioPlayer = useRef<HTMLAudioElement>(
		typeof Audio !== "undefined" ? new Audio() : null,
	);
	const [useTranscoding, setUseTranscoding] = useState(false);
	const hls = useRef(
		new Hls({
			xhrSetup: (xhr) => {
				xhr.withCredentials = true;
				xhr.setRequestHeader("X-CLIENT-ID", uuidv4());
			},
		}),
	);
	const videoPlayer = useRef<HTMLVideoElement>();
	const progress = useRef<number | null>(null);
	const [duration, setDuration] = useState<number | undefined>(undefined);
	const [playing, setPlaying] = useState<boolean>();
	const playerComponentRef = useRef<HTMLDivElement>(null);
	const [expanded, setExpanded] = useState(false);
	const [windowFocused, setWindowFocused] = useState(true);
	const [notification, setNotification] = useState<Notification>();
	const bottomNavigationIsDisplayed = useMediaQuery(
		theme.breakpoints.down(DrawerBreakpoint),
	);
	const allowNotifications: boolean | null =
		useReadLocalStorage("allow_notifs");
	const play = () => {
		// Do nothing if empty playlist
		if (playlist.length === 0) {
			return;
		}
		// If playlist but cursor to -1
		if (currentTrack === undefined) {
			skipTrack();
		}
		player.current?.play();
	};
	const pause = () => {
		setPlaying(false);
		player.current?.pause();
	};
	const onSkipTrack = () => {
		// If last track, disable player
		if (cursor >= playlist.length - 1) {
			pause();
		}
		skipTrack();
	};
	const onRewind = () => {
		if (player.current && player.current.currentTime > 5) {
			player.current.currentTime = 0;
			return;
		}
		// If first track, disable player
		if (cursor === 0) {
			pause();
		}
		playPreviousTrack();
	};

	const startPlayback = (isTrancoding: boolean) => {
		player
			.current!.play()
			.then(() => {
				setPlaying(true);
				setDuration(
					currentTrack?.track.duration ??
						player.current?.duration ??
						hls.current?.media?.duration,
				);
				player.current!.ontimeupdate = () => {
					progress.current = player.current!.currentTime;
				};
				player.current!.onended = () => {
					if (currentTrack.track.songId) {
						API.setSongAsPlayed(currentTrack.track.songId);
					}
					progress.current = null;
					skipTrack();
				};
				player.current!.onpause = () => {
					if (player.current!.ended === false) {
						setPlaying(false);
					}
				};
				player.current!.onplay = () => {
					setPlaying(true);
				};
				player.current!.onplaying = () => {
					setPlaying(true);
				};
			})
			.catch((err) => {
				// Source: https://webidl.spec.whatwg.org/#notsupportederror
				// Sometimes, an error can be caused by a track change while the `play` promise is being resolved
				// But this does not seem to cause any malfunction
				// That's why we do that filtering
				const errcode = err.code;

				if (!errcode) {
					return;
				}
				switch (errcode) {
					case 9: // Format error
						if (isTrancoding) {
							toast.error(t("playbackError"), {
								id: "playbackError",
							});
							skipTrack();
						} else {
							setUseTranscoding(true);
						}
						// biome-ignore lint/suspicious/noConsole: For debug
						console.error(err);
						break;
					case 19: // Network error
						setPlaying(false);
						toast.error(t("networkError"), {
							id: "networkError",
						});
						break;
					default:
						break;
				}
			});
	};

	useEffect(() => {
		const onFocus = () => setWindowFocused(true);
		const onBlur = () => setWindowFocused(false);

		window.addEventListener("focus", onFocus);
		window.addEventListener("blur", onBlur);
		return () => {
			window.removeEventListener("focus", onFocus);
			window.removeEventListener("blur", onBlur);
		};
	}, []);
	useEffect(() => {
		window.onbeforeunload = () => {
			if (playing) {
				return t("leaveWillStopPlaybackAlert");
			}
			return undefined;
		};
	}, [playing]);
	useEffect(() => {
		if (useTranscoding && currentTrack) {
			if (!Hls.isSupported()) {
				setUseTranscoding(false);
				hls.current!.detachMedia();
				return;
			}
			if (!player.current) {
				return;
			}
			const streamURL = API.getTranscodeStreamURL(
				currentTrack.track.sourceFileId,
				currentTrack.track.type,
			);
			hls.current!.loadSource(streamURL);
			hls.current!.attachMedia(player.current);
			hls.current!.on(Hls.Events.ERROR, (err, data) => {
				// biome-ignore lint/suspicious/noConsole: For debug
				console.error(err, data);
			});
			hls.current!.on(Hls.Events.MEDIA_ATTACHED, () => {
				startPlayback(true);
			});
		}
	}, [useTranscoding]);
	useEffect(() => {
		if (!userIsAuthentified) {
			pause();
			playTracks({ tracks: [] });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userIsAuthentified]);
	useKeyboardBinding(
		{
			key: "p",
			description: "openClosePlayer",
			handler: () => setExpanded((v) => !v),
		},
		[expanded],
	);
	useKeyboardBinding(
		{
			key: "esc",
			description: "closePlayer",
			handler: () => setExpanded(false),
		},
		[expanded],
	);
	useKeyboardBinding(
		{
			key: "space",
			description: "playPauseWhenExpanded",
			handler: () => {
				if (!expanded) {
					return;
				}
				if (playing) {
					pause();
				} else {
					play();
				}
			},
		},
		[expanded, playing, pause, play],
	);
	useEffect(() => {
		if (player.current) {
			player.current.onpause = null;
		}
		if (hls.current) {
			hls.current.detachMedia();
		}
		player.current?.pause();
		progress.current = null;
		if (typeof navigator.mediaSession !== "undefined") {
			navigator.mediaSession.metadata = null;
			navigator.mediaSession.setActionHandler("play", play);
			navigator.mediaSession.setActionHandler("pause", pause);
			navigator.mediaSession.setActionHandler("previoustrack", onRewind);
			navigator.mediaSession.setActionHandler("nexttrack", onSkipTrack);
		}
		setUseTranscoding(false);
		if (currentTrack) {
			progress.current = 0;
			notification?.close();
			setPlaying(true);
			setDuration(currentTrack.track.duration ?? undefined);
			const newIllustrationURL = currentTrack.track.illustration?.url;

			if (currentTrack.track.type === "Audio") {
				player.current = audioPlayer.current ?? undefined;
			} else {
				player.current = videoPlayer.current;
			}
			player.current!.src = API.getDirectStreamURL(
				currentTrack.track.sourceFileId,
			);
			startPlayback(false);
			if (typeof navigator.mediaSession !== "undefined") {
				navigator.mediaSession.metadata = new MediaMetadata({
					title: currentTrack.track.name,
					artist: currentTrack.artist.name,
					artwork: newIllustrationURL
						? [
								{
									src: API.getIllustrationURL(
										newIllustrationURL,
									),
								},
							]
						: undefined,
				});
			}
			if (
				typeof Notification !== "undefined" &&
				!windowFocused &&
				Notification.permission === "granted" &&
				allowNotifications
			) {
				try {
					setNotification(
						new Notification(currentTrack.track.name, {
							icon: newIllustrationURL
								? API.getIllustrationURL(newIllustrationURL)
								: "/icon.png",
							body: currentTrack.artist.name,
						}),
					);
					// eslint-disable-next-line no-empty
				} catch {}
			}
		} else {
			if (player.current) {
				hls.current?.detachMedia();
				player.current.src = "";
			}
			setDuration(undefined);
			setPlaying(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTrack]);
	const playerBgColor = useMemo(() => {
		const themePaperColor = `rgba(${theme.vars.palette.background.defaultChannel} / 0.75)`;
		const artworkColor = currentTrack?.track.illustration?.colors.at(0);

		if (artworkColor) {
			return `color-mix(in srgb, ${artworkColor} 30%, ${themePaperColor})`;
		}
		return themePaperColor;
	}, [theme, currentTrack]);
	const transition = "background 0.4s ease";
	const blur = "blur(20px)";
	const playerControlProps = {
		expanded: expanded,
		track: currentTrack?.track,
		artist: currentTrack?.artist,
		playing: playing ?? false,
		onPause: pause,
		onPlay: play,
		isTranscoding: useTranscoding,
		onExpand: (expand: boolean) => setExpanded(expand),
		duration: duration,
		progress: progress,
		onSkipTrack: onSkipTrack,
		onRewind: onRewind,
		videoRef: videoPlayer as unknown as LegacyRef<HTMLVideoElement>,
		onSlide: (newProgress: number) => {
			if (player.current !== undefined) {
				player.current.currentTime = newProgress;
			}
		},
	};

	return (
		<>
			<Grow
				in={playlist.length !== 0 || player.current !== undefined}
				unmountOnExit
			>
				<Box sx={{ height: 58 }} />
			</Grow>
			<Slide
				style={{
					position: "absolute",
					bottom: bottomNavigationIsDisplayed ? "56px" : 0,
					right: 0,
				}}
				direction="up"
				mountOnEnter
				unmountOnExit
				in={playlist.length !== 0 || player.current !== undefined}
			>
				<Box sx={{ padding: 1, zIndex: "modal", width: "100%" }}>
					<Paper
						ref={playerComponentRef}
						elevation={5}
						sx={{
							borderRadius: "0.5",
							padding: 1,
							display: "flex",
							width: "100%",
							height: "fit-content",
							background: playerBgColor,
							transition: transition,
							backdropFilter: blur,
						}}
					>
						<MinimizedPlayerControls {...playerControlProps} />
					</Paper>
				</Box>
			</Slide>
			<Slide
				in={expanded}
				style={{ position: "fixed", bottom: 0, left: 0 }}
				direction="up"
			>
				<Box
					sx={{
						// padding: 1,
						zIndex: "tooltip",
						width: "100%",
						height: "100%",
					}}
				>
					<Paper
						elevation={5}
						sx={{
							borderRadius: 0,
							display: "flex",
							width: "100%",
							height: "100%",
							overflow: "clip",
							background: playerBgColor,
							transition: transition,
							backdropFilter: blur,
						}}
					>
						<ExpandedPlayerControls {...playerControlProps} />
					</Paper>
				</Box>
			</Slide>
		</>
	);
};

export default Player;
