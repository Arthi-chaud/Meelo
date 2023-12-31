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

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import Artist from "../models/artist";
import Track from "../models/track";

type TrackState = {
	track: Track;
	artist: Artist;
};

interface PlayerState {
	/**
	 * The collection of track in the playlist
	 */
	playlist: TrackState[];
	/**
	 * The position of the current track in the playlist
	 * Acts like a cursor
	 * If it equals -1, the playlist is finished or not playing
	 */
	cursor: number;
}

export const playerSlice = createSlice({
	name: "player",
	initialState: <PlayerState>{
		playlist: [],
		cursor: -1,
	},
	reducers: {
		playTrack: (state, action: PayloadAction<TrackState>) => {
			state.playlist = [action.payload];
			state.cursor = 0;
		},
		playNext: (state, action: PayloadAction<TrackState>) => {
			state.playlist.splice(state.cursor + 1, 0, action.payload);
		},
		playAfter: (state, action: PayloadAction<TrackState>) => {
			state.playlist.push(action.payload);
		},
		playTracks: (
			state,
			action: PayloadAction<{ tracks: TrackState[]; cursor?: number }>,
		) => {
			state.playlist = action.payload.tracks;
			state.cursor = action.payload.cursor ?? 0;
		},
		skipTrack: (state, action: PayloadAction<void>) => {
			state.cursor++;
			if (state.cursor >= state.playlist.length) {
				state.cursor = -1;
			}
		},
		playPreviousTrack: (state, action: PayloadAction<void>) => {
			if (state.cursor >= 0) {
				state.cursor--;
			}
		},
		reorder: (
			state,
			action: PayloadAction<Record<"from" | "to", number>>,
		) => {
			const [removed] = state.playlist.splice(action.payload.from, 1);

			state.playlist.splice(action.payload.to, 0, removed);
		},
		emptyPlaylist: (state, action: PayloadAction<void>) => {
			state.playlist = [];
			state.cursor = 0;
		},
	},
});

export const {
	playTrack,
	playTracks,
	playNext,
	playAfter,
	skipTrack,
	playPreviousTrack,
	reorder,
	emptyPlaylist,
} = playerSlice.actions;

export default playerSlice.reducer;
