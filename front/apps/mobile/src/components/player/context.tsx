import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import * as MediaControls from "react-native-media-notification";
import uuid from "react-native-uuid";
import {
	type onLoadData,
	type onPlaybackStateChangeData,
	type onProgressData,
	type VideoConfig,
	VideoPlayer,
} from "react-native-video";
import type API from "@/api";
import type { QueryClient } from "@/api/hook";
import { getSettings } from "@/api/queries";
import {
	cursorAtom,
	emptyPlaylistAtom,
	loopModeAtom,
	playlistAtom,
	skipTrackAtom,
	type TrackState,
} from "@/state/player";
import { store } from "@/state/store";
import formatArtists from "@/utils/format-artists";
import { getAPI, useQuery, useQueryClient } from "~/api";
import {
	downloadFile,
	getDownloadStatus,
	queuePrefetchCountAtom,
	useDownloadManager,
} from "~/downloads";
import {
	currentTrackAtom,
	durationAtom,
	isBufferingAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	requestedProgressAtom,
	rewindTrackAtom,
} from "./state";
// Should be used as a readonly handle, mainly for the VideoView component
export const videoPlayerAtom = atom<VideoPlayer | null>(null);

// These can be used
export const useHLSAtom = atom(false);
const _canUseHLSAtom = atom(false);
export const canUseHLSAtom = atom((get) => get(_canUseHLSAtom));

export const PlayerContext = () => {
	const queryClient = useQueryClient();
	const api = queryClient.api;
	const playerRef = useRef<VideoPlayer | null>(null);
	const setPlayer = useSetAtom(videoPlayerAtom);
	const cursor = useAtomValue(cursorAtom);
	const isPlaying = useAtomValue(isPlayingAtom);
	const setIsBuffering = useSetAtom(isBufferingAtom);
	const [requestedProgress, setRequestedProgress] = useAtom(
		requestedProgressAtom,
	);
	const play = useSetAtom(playAtom);
	const pause = useSetAtom(pauseAtom);
	const [markedAsPlayed, setMarkedAsPlayed] = useState(false);
	const setProgress = useSetAtom(progressAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const setDuration = useSetAtom(durationAtom);
	const currentTrack = useAtomValue(currentTrackAtom);
	const playlist = useAtomValue(playlistAtom);
	const onProgressRef = useRef<any>(null);
	const [isHLS, setIsHLS] = useAtom(useHLSAtom);
	const [canUseHLS, setCanUseHLS] = useAtom(_canUseHLSAtom);
	const { data: settings } = useQuery(getSettings);
	const isSwitchingTrack = useRef(false);

	const { download } = useDownloadManager();

	useNotificationControls();
	useEffect(() => {
		setCanUseHLS(settings?.transcoderAvailable === true);
	}, [settings]);
	useEffect(() => {
		const prefetchCount = store.get(queuePrefetchCountAtom);
		const queue = playlist.slice(
			cursor === -1 ? 0 : cursor,
			prefetchCount + 1 + cursor, // NOTE: add one to include current song
		);
		for (const track of queue) {
			if (track.track.type === "Audio")
				download(track.track.sourceFileId);
		}
	}, [playlist, cursor]);
	useEffect(() => {
		if (!playerRef.current) {
			return;
		}
		const onProgress = (data: onProgressData) => {
			if (!playerRef.current?.isPlaying || !currentTrack) {
				return;
			}
			setProgress(data.currentTime);
			if (markedAsPlayed || !currentTrack.track.songId) {
				return;
			}
			const isMoreThanFourMinutes = data.currentTime >= 4 * 60;
			const isPastHalfwayPoint = currentTrack.track.duration
				? data.currentTime > currentTrack.track.duration / 2
				: 0;
			if (isMoreThanFourMinutes || isPastHalfwayPoint) {
				setMarkedAsPlayed(true);
				api.setSongAsPlayed(currentTrack.track.songId);
			}
		};
		if (onProgressRef.current) onProgressRef?.current.remove?.();
		onProgressRef.current = playerRef.current.addEventListener(
			"onProgress",
			onProgress,
		);
	}, [markedAsPlayed, currentTrack, playerRef.current?.isPlaying]);
	useEffect(() => {
		setMarkedAsPlayed(false);
		setProgress(0);
		setRequestedProgress(null);
		setDuration(null);
		setIsHLS(false);
		if (!currentTrack) {
			playerRef.current?.pause();
			pause();
			return;
		}
		if (playerRef.current === null) {
			mkSource(queryClient, currentTrack).then((source) => {
				playerRef.current = new VideoPlayer(source);
				playerRef.current.mixAudioMode = "doNotMix";
				playerRef.current.ignoreSilentSwitchMode = "ignore";
				playerRef.current.showNotificationControls = false;
				playerRef.current.playInBackground = true;
				playerRef.current.addEventListener(
					"onPlaybackStateChange",
					(e: onPlaybackStateChangeData) => {
						if (e.isBuffering) {
							setIsBuffering(true);
							return;
						}
						setIsBuffering(false);
						setRequestedProgress(null);
						if (e.isPlaying) {
							play();
							// Only 'pause' if the pause wasn't caused by a track change
						} else if (!isSwitchingTrack.current) {
							pause();
						}
					},
				);
				playerRef.current.addEventListener("onEnd", () => {
					skipTrack(queryClient);
				});
				playerRef.current.addEventListener(
					"onLoad",
					(data: onLoadData) => {
						if (!Number.isNaN(data.duration)) {
							setDuration(data.duration);
						} else {
							setDuration(currentTrack.track.duration);
						}
					},
				);
				playerRef.current.volume = 1;
				playerRef.current.addEventListener("onError", (e) => {
					if (
						!isHLS &&
						e.code === "source/unsupported-content-type" &&
						canUseHLS
					) {
						setIsHLS(true);
					}
					// biome-ignore lint/suspicious/noConsole: For debug
					console.error(e);
				});
				playerRef.current.play();
				play();
				setPlayer(playerRef.current);
			});
		} else {
			isSwitchingTrack.current = true;
			playerRef.current!.pause();
			mkSource(queryClient, currentTrack).then((source) => {
				playerRef.current
					?.replaceSourceAsync(source)
					.then(() => {
						playerRef.current!.play();
					})
					.finally(() => {
						isSwitchingTrack.current = false;
					});
			});
		}
	}, [currentTrack]);

	useEffect(() => {
		if (requestedProgress === null) {
			return;
		}
		playerRef.current?.seekTo(requestedProgress);
		setProgress(requestedProgress);
		if (requestedProgress === 0) {
			setMarkedAsPlayed(false);
		}
	}, [requestedProgress]);
	useEffect(() => {
		if (!playerRef.current || !currentTrack) {
			return;
		}
		const timestamp = playerRef.current?.currentTime;

		mkSource(queryClient, currentTrack, isHLS).then((source) =>
			playerRef.current?.replaceSourceAsync(source).then(() => {
				playerRef.current!.play();
				if (isHLS) {
					playerRef.current!.seekTo(timestamp);
				}
			}),
		);
	}, [isHLS]);

	useEffect(() => {
		if (!playerRef.current) {
			return;
		}
		if (isPlaying && !playerRef.current.isPlaying) {
			if (cursor === -1) {
				skipTrack(queryClient);
				return;
			}
			playerRef.current.play();
		} else if (!isPlaying) {
			playerRef.current.pause();
		}
	}, [isPlaying]);

	useEffect(() => {
		return () => {
			playerRef.current?.release();
			playerRef.current = null;
			setPlayer(null);
		};
	}, []);

	return null;
};

const clientId = uuid.v4();

const mkSource = async (
	queryClient: QueryClient,
	st: TrackState,
	useHLS: boolean = false,
) => {
	const api = getAPI();
	const [dlStatus, localPath] = await getDownloadStatus(
		st.track.sourceFileId,
	);
	const shouldDownload = !useHLS && st.track.type === "Audio";
	if (!shouldDownload || dlStatus !== "downloaded") {
		if (shouldDownload) {
			await downloadFile(queryClient)(st.track.sourceFileId);
		}
		return _mkSource(st, api, useHLS);
	}

	return _mkSource(st, api, false, localPath);
};

const _mkSource = (
	{ track }: TrackState,
	api: API,
	useTranscoding = false,
	localPath?: string,
): VideoConfig => ({
	uri:
		localPath ??
		(useTranscoding
			? api.getTranscodeStreamURL(track.sourceFileId, track.type)
			: api.getDirectStreamURL(track.sourceFileId)),
	headers: {
		...api.getAuthHeaders(),
		...(useTranscoding
			? {
					"X-CLIENT-ID": clientId,
				}
			: {}),
	},
});

const useNotificationControls = () => {
	const queryClient = useQueryClient();
	const currentTrack = useAtomValue(currentTrackAtom);
	const isPlaying = useAtomValue(isPlayingAtom);

	// Setup
	useEffect(() => {
		MediaControls.enableBackgroundMode(true);
		MediaControls.enableAudioInterruption(true);
		MediaControls.setControlEnabled("shuffle", false);
		const play = MediaControls.addEventListener("play", () =>
			store.set(playAtom),
		);
		const pause = MediaControls.addEventListener("pause", () =>
			store.set(pauseAtom),
		);
		const rewind = MediaControls.addEventListener("skipToPrevious", () =>
			store.set(rewindTrackAtom),
		);
		const skip = MediaControls.addEventListener("skipToNext", () =>
			store.set(skipTrackAtom, queryClient),
		);
		const stop = MediaControls.addEventListener("stop", () =>
			store.set(emptyPlaylistAtom),
		);
		const seek = MediaControls.addEventListener("seek", (data) => {
			if (data?.seekPosition !== undefined)
				store.set(requestedProgressAtom, data.seekPosition);
		});
		const repeatMode = MediaControls.addEventListener(
			"repeatMode",
			(data) => {
				if (data?.repeatMode !== undefined)
					store.set(
						loopModeAtom,
						data.repeatMode === "off"
							? "none"
							: data.repeatMode === "all"
								? "queue"
								: "track",
					);
			},
		);
		//TODO: seek forward/backward

		return () => {
			play.remove();
			rewind.remove();
			skip.remove();
			pause.remove();
			seek.remove();
			stop.remove();
			repeatMode.remove();
		};
	}, [queryClient]);

	// Set base metadata
	useEffect(() => {
		if (!currentTrack) {
			MediaControls.stopMediaNotification();
			return;
		}
		MediaControls.updateMetadata({
			title: currentTrack.track.name,
			artist: formatArtists(currentTrack.artist, currentTrack.featuring),
			duration: currentTrack.track.duration ?? undefined,
			artwork: currentTrack.track.illustration
				? queryClient.api.getIllustrationURL(
						currentTrack.track.illustration.url,
						"original",
						true,
					)
				: undefined,
		});
	}, [currentTrack, queryClient]);

	// Set playing status
	useEffect(() => {
		if (currentTrack) MediaControls.updateMetadata({ isPlaying });
	}, [isPlaying, currentTrack]);

	// Update progress
	useEffect(() => {
		setInterval(() => {
			const track = store.get(currentTrackAtom);
			if (!track) {
				return;
			}

			const position = store.get(progressAtom);
			const duration = store.get(durationAtom) ?? undefined;
			MediaControls.updateMetadata({ duration, position });
		}, 500);
	}, []);
};
