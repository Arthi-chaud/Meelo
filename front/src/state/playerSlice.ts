import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import Artist from "../models/artist";
import Release from "../models/release";
import Track from "../models/track";

type TrackState = {
	track: Track;
	artist: Artist;
	release: Release;
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
} = playerSlice.actions;

export default playerSlice.reducer;
