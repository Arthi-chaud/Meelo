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
import Hls from "hls.js";
import { useAtom, useSetAtom } from "jotai";
import { type LegacyRef, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useReadLocalStorage } from "usehooks-ts";
import { v4 as uuidv4 } from "uuid";
import {
	cursorAtom,
	playlistAtom,
	playlistLoadingAtom,
	playPreviousTrackAtom,
	playTracksAtom,
	skipTrackAtom,
	type TrackState,
} from "@/state/player";
import { useQueryClient } from "~/api";
import { DrawerBreakpoint } from "~/components/scaffold";
import { useKeyboardBinding } from "~/contexts/keybindings";
import { userAtom } from "~/state/user";
import { ExpandedPlayerControls } from "./controls/expanded";
import { MinimizedPlayerControls } from "./controls/minimized";

const Player = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [user] = useAtom(userAtom);
	const queryClient = useQueryClient();
	const api = queryClient.api;
	const playPreviousTrack = useSetAtom(playPreviousTrackAtom);
	const playTracks = useSetAtom(playTracksAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const [cursor] = useAtom(cursorAtom);
	const [playlist] = useAtom(playlistAtom);
	const [playlistLoading] = useAtom(playlistLoadingAtom);
	const currentTrack = useMemo<TrackState | undefined>(
		() => playlist[cursor],
		[cursor, playlist],
	);
	const markedAsPlayed = useRef(false);

	const nextTrack = useMemo<TrackState | undefined>(
		() => playlist[cursor + 1],
		[cursor, playlist],
	);
	const throwawayAudioPlayer = useRef<HTMLAudioElement>();
	const audioPlayer = useRef<HTMLAudioElement>();
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
	const player = useMemo(() => {
		if (!currentTrack) {
			return null;
		}
		if (currentTrack.track.type === "Video") {
			return videoPlayer;
		}
		return audioPlayer;
	}, [currentTrack]);
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

	const crossfade: number | null = useReadLocalStorage("crossfade");
	const play = () => {
		// Do nothing if empty playlist
		if (playlist.length === 0) {
			return;
		}
		// If playlist but cursor to -1
		if (currentTrack === undefined) {
			skipTrack(queryClient);
		}
		player?.current?.play();
	};
	const pause = () => {
		setPlaying(false);
		if (throwawayAudioPlayer?.current) {
			throwawayAudioPlayer.current.pause();
			throwawayAudioPlayer.current.src = "";
		}
		player?.current?.pause();
	};
	const onSkipTrack = () => {
		if (throwawayAudioPlayer?.current) {
			throwawayAudioPlayer.current.pause();
			throwawayAudioPlayer.current.src = "";
		}
		// If last track, disable player
		if (cursor >= playlist.length - 1) {
			pause();
		}
		skipTrack(queryClient);
	};
	const onRewind = () => {
		if (player?.current && player.current.currentTime > 5) {
			player.current.currentTime = 0;
			return;
		}
		// If first track, disable player
		if (cursor === 0) {
			pause();
		}
		playPreviousTrack();
	};
	const switchTrackIfCrossfade = (): boolean => {
		const currentTrackIsAudio = currentTrack?.track.type === "Audio";
		const nextTrackIsAudio = nextTrack?.track.type === "Audio";
		if (!player?.current) {
			//Can happen when component is unmounted
			//e.g. on logout
			return false;
		}
		if (
			crossfade != null &&
			nextTrackIsAudio &&
			currentTrackIsAudio &&
			!Number.isNaN(player!.current!.duration) &&
			Math.abs(
				player!.current!.currentTime - player!.current!.duration,
			) <= crossfade
		) {
			const newId = throwawayAudioPlayer.current!.id;
			throwawayAudioPlayer.current = document.getElementById(
				audioPlayer.current!.id,
			) as HTMLAudioElement;
			audioPlayer.current = document.getElementById(
				newId,
			) as HTMLAudioElement;

			throwawayAudioPlayer.current!.onpause = null;
			throwawayAudioPlayer.current!.onended = () => {
				if (throwawayAudioPlayer?.current) {
					throwawayAudioPlayer.current.pause();
					throwawayAudioPlayer.current.src = "";
				}
			};
			// Note: it might be a bit redundant, but we need to do this when
			// user slided in the crossfade zone.
			// Hypothesis: Since progress will be set back at 0, the 'halfway point' is never reached (?)
			if (currentTrack?.track.songId && !markedAsPlayed.current) {
				api.setSongAsPlayed(currentTrack.track.songId);
			}
			skipTrack(queryClient);
			return true;
		}
		return false;
	};

	const startPlayback = (isTrancoding: boolean) => {
		player
			?.current!.play()
			.then(() => {
				const duration_ =
					currentTrack?.track.duration ??
					player.current?.duration ??
					hls.current?.media?.duration;
				setPlaying(true);
				setDuration(duration_);
				player.current!.ontimeupdate = () => {
					if (
						currentTrack?.track.songId &&
						!markedAsPlayed.current &&
						progress.current !== null
					) {
						const isMoreThanFourMinutes = progress.current > 4 * 60;
						const isPastHalfwayPoint = duration_
							? progress.current > duration_ / 2
							: false;
						if (isPastHalfwayPoint || isMoreThanFourMinutes) {
							markedAsPlayed.current = true;
							api.setSongAsPlayed(currentTrack.track.songId);
						}
					}
					if (!switchTrackIfCrossfade() && player.current) {
						progress.current = player.current.currentTime;
					}
				};
				player.current!.onended = () => {
					progress.current = null;
					skipTrack(queryClient);
				};
				player.current!.onpause = () => {
					throwawayAudioPlayer.current?.pause();
					if (player.current?.ended === false) {
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
							toast.error(t("toasts.player.playbackError"), {
								id: "playbackError",
							});
							skipTrack(queryClient);
						} else {
							setUseTranscoding(true);
						}
						// biome-ignore lint/suspicious/noConsole: For debug
						console.error(err);
						break;
					case 19: // Network error
						setPlaying(false);
						toast.error(t("toasts.player.networkError"), {
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
				return t("toasts.leaveWillStopPlaybackAlert");
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
			if (!player?.current) {
				return;
			}
			const streamURL = api.getTranscodeStreamURL(
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
		if (!user) {
			pause();
		}
		return () => {
			playTracks({ tracks: [] });
		};
	}, [user]);
	useKeyboardBinding(
		{
			key: "p",
			description: "keyboardBindings.openClosePlayer",
			handler: () => setExpanded((v) => !v),
		},
		[expanded],
	);
	useKeyboardBinding(
		{
			key: "esc",
			description: "keyboardBindings.closePlayer",
			handler: () => setExpanded(false),
		},
		[expanded],
	);
	useKeyboardBinding(
		{
			key: "space",
			description: "keyboardBindings.playPauseWhenExpanded",
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
		if (player?.current) {
			player.current.onpause = null;
		}
		if (hls.current) {
			hls.current.detachMedia();
		}
		// player?.current?.pause();
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
			markedAsPlayed.current = false;
			progress.current = 0;
			notification?.close();
			setPlaying(true);
			setDuration(currentTrack.track.duration ?? undefined);
			const newIllustrationURL = currentTrack.track.illustration?.url;

			player!.current!.src = api.getDirectStreamURL(
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
									src: api.getIllustrationURL(
										newIllustrationURL,
										"medium",
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
								? api.getIllustrationURL(
										newIllustrationURL,
										"low",
									)
								: "/icon-white.png",
							body: currentTrack.artist.name,
						}),
					);
				} catch {}
			}
		} else {
			if (player?.current) {
				hls.current?.detachMedia();
				player.current.src = "";
			}
			setDuration(undefined);
			setPlaying(false);
		}
		return () => {
			player?.current?.pause();
			navigator.mediaSession.metadata = null;
		};
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
		featuring: currentTrack?.featuring,
		playing: playing ?? false,
		playlistLoading: playlistLoading,
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
			if (player?.current !== undefined) {
				player.current.currentTime = newProgress;
				if (switchTrackIfCrossfade() && throwawayAudioPlayer.current) {
					throwawayAudioPlayer.current.pause();
					throwawayAudioPlayer.current.src = "";
				}
			}
		},
	};

	return (
		<>
			{/* biome-ignore lint/a11y/useMediaCaption: ignore */}
			<audio id="player1" ref={audioPlayer as any} />
			{/* biome-ignore lint/a11y/useMediaCaption: ignore */}
			<audio id="player2" ref={throwawayAudioPlayer as any} />
			<Grow
				in={
					playlistLoading ||
					playlist.length !== 0 ||
					player?.current !== undefined
				}
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
				in={
					playlistLoading ||
					playlist.length !== 0 ||
					player?.current !== undefined
				}
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
							overflow: "hidden",
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
