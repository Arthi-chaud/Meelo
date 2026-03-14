import { atom } from "jotai";
import type { QueryClient } from "@/api/hook";
import {
	cursorAtom,
	loopModeAtom,
	playlistAtom,
	playPreviousTrackAtom,
	skipTrackAtom as skipTrackAtom_,
	type TrackState,
} from "@/state/player";

export const currentTrackAtom = atom(
	(get): TrackState | null => get(playlistAtom)[get(cursorAtom)],
);

export const playAtom = atom(null, (_, set) => set(_isPlaying, true));
export const pauseAtom = atom(null, (_, set) => set(_isPlaying, false));
export const isBufferingAtom = atom(false);
export const isPlayingAtom = atom((get) => get(_isPlaying));
// Duration is in seconds
export const durationAtom = atom<null | number>(null);
// Progress is in seconds
export const progressAtom = atom(0);

export const requestedProgressAtom = atom(0 as number | null);

export const skipTrackAtom = atom(null, (get, set, qc: QueryClient) => {
	const loopMode = get(loopModeAtom);
	if (loopMode === "track") {
		set(requestedProgressAtom, 0);
	} else {
		set(skipTrackAtom_, qc);
	}
});

export const rewindTrackAtom = atom(null, (get, set) => {
	const progress = get(progressAtom);
	const loopMode = get(loopModeAtom);
	if (progress > 5 || loopMode === "track") {
		set(requestedProgressAtom, 0);
	} else {
		set(playPreviousTrackAtom);
	}
});

const _isPlaying = atom(false);
