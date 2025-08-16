import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
	type onLoadData,
	type onProgressData,
	VideoPlayer,
} from "react-native-video";
import type API from "@/api";
import type Track from "@/models/track";
import { useAPI } from "~/api";
import {
	currentTrackAtom,
	durationAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	requestedProgressAtom,
} from "./state";

//TODO Metadata
//TODO On End: push to api
//TODO On end go to next song
//TODO Preload next track?
//TODO when end of playlist is reached, play should start again

export const PlayerContext = () => {
	const api = useAPI();
	const playerRef = useRef<VideoPlayer | null>(null);
	const isPlaying = useAtomValue(isPlayingAtom);
	const requestedProgress = useAtomValue(requestedProgressAtom);
	const play = useSetAtom(playAtom);
	const pause = useSetAtom(pauseAtom);
	const setProgress = useSetAtom(progressAtom);
	const setDuration = useSetAtom(durationAtom);
	const currentTrack = useAtomValue(currentTrackAtom);

	useEffect(() => {
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
			playerRef.current.onProgress = (data: onProgressData) => {
				setProgress(data.currentTime);
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
		playerRef.current?.seekTo(requestedProgress);
	}, [requestedProgress]);

	useEffect(() => {
		if (!playerRef.current) {
			return;
		}
		if (isPlaying && !playerRef.current.isPlaying) {
			playerRef.current.play();
		} else if (!isPlaying) {
			playerRef.current.pause();
		}
	}, [isPlaying]);

	useEffect(() => {
		return () => {
			playerRef.current?.release();
			playerRef.current = null;
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
