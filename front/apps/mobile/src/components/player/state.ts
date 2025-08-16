import { atom } from "jotai";
import { cursorAtom, playlistAtom, type TrackState } from "@/state/player";

export const currentTrackAtom = atom(
	(get): TrackState | null => get(playlistAtom)[get(cursorAtom)],
);

export const playAtom = atom(null, (_, set) => set(_isPlaying, true));
export const pauseAtom = atom(null, (_, set) => set(_isPlaying, false));
export const isPlayingAtom = atom((get) => get(_isPlaying));
// Duration is in seconds
export const durationAtom = atom<null | number>(null);
// Progress is in seconds
export const progressAtom = atom(0);

const _isPlaying = atom(false);
