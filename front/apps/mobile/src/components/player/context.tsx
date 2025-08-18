import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type onLoadData,
	type onProgressData,
	VideoPlayer,
} from "react-native-video";
import type API from "@/api";
import type Track from "@/models/track";
import { cursorAtom, skipTrackAtom } from "@/state/player";
import { useAPI, useQueryClient } from "~/api";
import {
	bufferedAtom,
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
	const setBuffered = useSetAtom(bufferedAtom);
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
			setBuffered((b) =>
				// The bufferDuration is the length of the current segment being played
				// Not sure if we can get the total buffered length
				// This is to prevent flicker when rewinding a song
				// But change changing the song
				Math.max(b, data.currentTime + data.bufferDuration),
			);
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
		setBuffered(0);
		if (!currentTrack) {
			playerRef.current?.pause();
			pause();
			playerRef.current?.replaceSourceAsync(null);
			return;
		}
		if (playerRef.current === null) {
			playerRef.current = new VideoPlayer(
				mkSource(currentTrack.track, api),
			);
			playerRef.current.onProgress = onProgress;
			playerRef.current.onEnd = () => {
				skipTrack(queryClient);
			};
			playerRef.current.onLoad = (data: onLoadData) => {
				if (!Number.isNaN(data.duration)) {
					setDuration(data.duration);
				} else {
					setDuration(currentTrack.track.duration);
				}
			};
			playerRef.current.volume = 1;
			// biome-ignore lint/suspicious/noConsole: For debug
			playerRef.current.onError = (e) => console.error(e);
			playerRef.current.play();
			play();
			setPlayer(playerRef.current);
		} else {
			playerRef.current.pause();
			playerRef.current
				.replaceSourceAsync(mkSource(currentTrack.track, api))
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
		playerRef.current.onProgress = onProgress;
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

const mkSource = (track: Track, api: API) => ({
	uri: api.getDirectStreamURL(track.sourceFileId),
	headers: {
		Authorization: `Bearer ${api.accessToken}`,
	},
	// metadata: {
	// 	title: track.name,
	// 	subtitle: "Custom Subtitle",
	// 	artist: "Custom Artist",
	// 	description: "Custom Description",
	// 	imageUri:
	// 		"https://pbs.twimg.com/profile_images/1498641868397191170/6qW2XkuI_400x400.png",
	// },
});
