import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type onLoadData,
	type onProgressData,
	type VideoConfig,
	VideoPlayer,
} from "react-native-video";
import type API from "@/api";
import { cursorAtom, skipTrackAtom, type TrackState } from "@/state/player";
import formatArtists from "@/utils/format-artists";
import { useAPI, useQueryClient } from "~/api";
import {
	currentTrackAtom,
	durationAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	requestedProgressAtom,
} from "./state";

// Should be used as a readonly handle, mainly for the VideoView component
export const videoPlayerAtom = atom<VideoPlayer | null>(null);

//TODO Metadata

export const PlayerContext = () => {
	const api = useAPI();
	const playerRef = useRef<VideoPlayer | null>(null);
	const setPlayer = useSetAtom(videoPlayerAtom);
	const cursor = useAtomValue(cursorAtom);
	const isPlaying = useAtomValue(isPlayingAtom);
	const requestedProgress = useAtomValue(requestedProgressAtom);
	const play = useSetAtom(playAtom);
	const pause = useSetAtom(pauseAtom);
	const [markedAsPlayed, setMarkedAsPlayed] = useState(false);
	const queryClient = useQueryClient();
	const setProgress = useSetAtom(progressAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const setDuration = useSetAtom(durationAtom);
	const currentTrack = useAtomValue(currentTrackAtom);

	const onProgress = useCallback(
		(data: onProgressData) => {
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
		},
		[markedAsPlayed, currentTrack, playerRef.current?.isPlaying],
	);
	useEffect(() => {
		setMarkedAsPlayed(false);
		setProgress(0);
		if (!currentTrack) {
			playerRef.current?.pause();
			pause();
			// playerRef.current?.replaceSourceAsync(null);
			return;
		}
		if (playerRef.current === null) {
			playerRef.current = new VideoPlayer(mkSource(currentTrack, api));
			playerRef.current.showNotificationControls = true;
			playerRef.current.playInBackground = true;
			playerRef.current.addEventListener("onProgress", onProgress);
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
			playerRef.current.addEventListener("onError", (e) =>
				// biome-ignore lint/suspicious/noConsole: For debug
				console.error(e),
			);
			playerRef.current.play();
			play();
			setPlayer(playerRef.current);
		} else {
			playerRef.current.pause();
			playerRef.current.showNotificationControls = true;
			playerRef.current
				.replaceSourceAsync(mkSource(currentTrack, api))
				.then(() => {
					playerRef.current?.play();
					play();
				});
		}
	}, [currentTrack]);

	useEffect(() => {
		if (!playerRef.current) {
			return;
		}
		// TODO clear old onProgress
		playerRef.current.addEventListener("onProgress", onProgress);
	}, [onProgress]);
	useEffect(() => {
		playerRef.current?.seekTo(requestedProgress);
		if (requestedProgress === 0) {
			setMarkedAsPlayed(false);
		}
	}, [requestedProgress]);

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

const mkSource = (
	{ track, artist, featuring }: TrackState,
	api: API,
): VideoConfig => ({
	uri: api.getDirectStreamURL(track.sourceFileId),
	headers: {
		Authorization: `Bearer ${api.accessToken}`,
	},
	metadata: {
		title: track.name,
		subtitle: "Custom Subtitle",
		artist: formatArtists(artist, featuring),
		imageUri: track.illustration
			? api.getIllustrationURL(track.illustration.url, "medium")
			: undefined,
	},
});
