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

import { atom } from "jotai";
import type Artist from "../models/artist";
import type { TrackWithRelations } from "../models/track";

export type QueueTrack = {
	track: TrackWithRelations<"illustration">;
	artist: Artist;
};

export type QueueState = {
	/**
	 * The collection of track in the playlist
	 */
	playlist: QueueTrack[];
	/**
	 * The position of the current track in the playlist
	 * Acts like a cursor
	 * If it equals -1, the playlist is finished or not playing
	 */
	cursor: number;
};

export const cursorAtom = atom((get) => get(_queueState).cursor);
export const playlistAtom = atom((get) => get(_queueState).playlist);
export const playTrackAtom = atom(null, (_, set, track: QueueTrack) => {
	set(_queueState, { playlist: [track], cursor: 0 });
});
export const playTracksAtom = atom(
	null,
	(_, set, { tracks, cursor }: { tracks: QueueTrack[]; cursor?: number }) => {
		set(_queueState, { playlist: tracks, cursor: cursor ?? 0 });
	},
);
export const skipTrackAtom = atom(null, (get, set) => {
	const state = get(_queueState);

	let newCursor = state.cursor + 1;
	if (newCursor >= state.playlist.length) {
		newCursor = -1;
	}
	set(_queueState, {
		cursor: newCursor,
		playlist: state.playlist,
	});
});

export const playPreviousTrackAtom = atom(null, (get, set) => {
	const state = get(_queueState);
	let newCursor = state.cursor;
	if (newCursor >= 0) {
		newCursor--;
	}
	set(_queueState, {
		cursor: newCursor,
		playlist: state.playlist,
	});
});
export const emptyPlaylistAtom = atom(null, (_, set) =>
	set(_queueState, { playlist: [], cursor: -1 }),
);

export const removeTrackAtom = atom(null, (get, set, trackIndex: number) => {
	const state = get(_queueState);
	set(_queueState, {
		cursor: state.cursor,
		playlist: state.playlist.filter((_, i) => i !== trackIndex),
	});
});
export const playNextAtom = atom(null, (get, set, track: QueueTrack) => {
	const state = get(_queueState);
	state.playlist.splice(state.cursor + 1, 0, track);
	const newState = {
		cursor: state.cursor,
		playlist: state.playlist,
	};
	set(_queueState, newState);
});

export const playAfterAtom = atom(null, (get, set, track: QueueTrack) => {
	const state = get(_queueState);
	set(_queueState, {
		playlist: [...state.playlist, track],
		cursor: state.cursor,
	});
});

export const reorderAtom = atom(
	null,
	(get, set, action: Record<"from" | "to", number>) => {
		const state = get(_queueState);
		const [removed] = state.playlist.splice(action.from, 1);
		state.playlist.splice(action.to, 0, removed);
		set(_queueState, {
			...state,
			playlist: state.playlist,
		});
	},
);
const _queueState = atom<QueueState>({ playlist: [], cursor: -1 });
