import { atom } from "jotai";
import { cursorAtom, playlistAtom, type TrackState } from "@/state/player";

export const currentTrackAtom = atom(
	(get): TrackState | null => get(playlistAtom)[get(cursorAtom)],
);
