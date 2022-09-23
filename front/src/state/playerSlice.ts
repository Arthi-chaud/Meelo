import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import Artist from '../models/artist';
import Release from '../models/release';
import Track from '../models/track';

type TrackState = {
	track: Track;
	artist: Artist;
	release: Release;
}

interface PlayerState {
	/**
	 * The last played tracks
	 * The last element of the array is the last played tracks
	 */
	history: TrackState[];
	currentTrack?: TrackState;
	/**
	 * The tracks to play next
	 * The first element of the array is the last played tracks
	 */
	playlist: TrackState[];
}

export const playerSlice = createSlice({
	name: 'player',
	initialState: <PlayerState>{
		history: [],
		currentTrack: undefined,
		playlist: []
	},
	reducers: {
		addTracks: (state, action: PayloadAction<{ tracks: TrackState | TrackState[], index?: number }>) => {
			if (Array.isArray(action.payload.tracks))
				state.playlist.splice(action.payload.index ?? 0, 0, ...action.payload.tracks);
			else
				state.playlist.splice(action.payload.index ?? 0, 0, action.payload.tracks);
		},
		playPreviousTrack: (state, action: PayloadAction<void>) => {
			if (state.currentTrack)
				state.playlist.splice(0, 0, state.currentTrack);
			state.currentTrack = state.history.pop();
		},
		playNextTrack: (state, action: PayloadAction<void>) => {
			state.currentTrack = state.playlist.shift();
		},
		emplyPlaylist: (state, action: PayloadAction<void>) => {
			state.playlist = [];
		}
	},
})

export const { addTracks, playPreviousTrack, playNextTrack, emplyPlaylist } = playerSlice.actions

export default playerSlice.reducer