import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import uuid from "react-native-uuid";
import {
	type onLoadData,
	type onPlaybackStateChangeData,
	type onProgressData,
	type VideoConfig,
	VideoPlayer,
} from "react-native-video";
import type API from "@/api";
import { getSettings } from "@/api/queries";
import { cursorAtom, skipTrackAtom, type TrackState } from "@/state/player";
import formatArtists from "@/utils/format-artists";
import { useAPI, useQuery, useQueryClient } from "~/api";
import {
	currentTrackAtom,
	durationAtom,
	isBufferingAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	requestedProgressAtom,
} from "./state";
// Should be used as a readonly handle, mainly for the VideoView component
export const videoPlayerAtom = atom<VideoPlayer | null>(null);

// These can be used
export const useHLSAtom = atom(false);
const _canUseHLSAtom = atom(false);
export const canUseHLSAtom = atom((get) => get(_canUseHLSAtom));

export const PlayerContext = () => {
	const api = useAPI();
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
	const queryClient = useQueryClient();
	const setProgress = useSetAtom(progressAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const setDuration = useSetAtom(durationAtom);
	const currentTrack = useAtomValue(currentTrackAtom);
	const onProgressRef = useRef<(d: onProgressData) => void>(null);
	const [isHLS, setIsHLS] = useAtom(useHLSAtom);
	const [canUseHLS, setCanUseHLS] = useAtom(_canUseHLSAtom);
	const { data: settings } = useQuery(getSettings);

	useEffect(() => {
		setCanUseHLS(settings?.transcoderAvailable === true);
	}, [settings]);
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
		if (onProgressRef.current)
			playerRef.current.removeEventListener(
				"onProgress",
				onProgressRef.current,
			);
		playerRef.current.addEventListener("onProgress", onProgress);
		onProgressRef.current = onProgress;
	}, [markedAsPlayed, currentTrack, playerRef.current?.isPlaying]);
	useEffect(() => {
		setMarkedAsPlayed(false);
		setProgress(0);
		setRequestedProgress(null);
		setIsHLS(false);
		if (!currentTrack) {
			playerRef.current?.pause();
			pause();
			return;
		}
		if (playerRef.current === null) {
			playerRef.current = new VideoPlayer(mkSource(currentTrack, api));
			playerRef.current.showNotificationControls = true;
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
					} else {
						pause();
					}
				},
			);
			playerRef.current.addEventListener("onEnd", () => {
				skipTrack(queryClient);
			});
			playerRef.current.addEventListener("onLoad", (data: onLoadData) => {
				if (!Number.isNaN(data.duration)) {
					setDuration(data.duration);
				} else {
					setDuration(currentTrack.track.duration);
				}
			});
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
		} else {
			playerRef.current.pause();
			playerRef.current
				.replaceSourceAsync(mkSource(currentTrack, api))
				.then(() => {
					playerRef.current?.play();
					play();
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
		playerRef.current
			.replaceSourceAsync(mkSource(currentTrack, api, isHLS))
			.then(() => {
				playerRef.current!.seekTo(timestamp);
				playerRef.current!.play();
			});
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

const mkSource = (
	{ track, artist, featuring }: TrackState,
	api: API,
	useTranscoding = false,
): VideoConfig => ({
	uri: useTranscoding
		? api.getTranscodeStreamURL(track.sourceFileId, track.type)
		: api.getDirectStreamURL(track.sourceFileId),
	headers: {
		Authorization: `Bearer ${api.accessToken}`,
		...(useTranscoding
			? {
					"X-CLIENT-ID": clientId,
				}
			: {}),
	},
	metadata: {
		title: track.name,
		artist: formatArtists(artist, featuring),
		imageUri: track.illustration
			? api.getIllustrationURL(track.illustration.url, "high", true)
			: undefined,
	},
});
