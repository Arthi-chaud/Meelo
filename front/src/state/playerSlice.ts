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
		playTrack: (state, action: PayloadAction<TrackState>) => {
			state.currentTrack = action.payload;
		},
		addTracksInPlaylist: (state, action: PayloadAction<{ tracks: TrackState | TrackState[], index?: number }>) => {
			if (Array.isArray(action.payload.tracks))
				state.playlist.splice(action.payload.index ?? 0, 0, ...action.payload.tracks);
			else
				state.playlist.splice(action.payload.index ?? 0, 0, action.payload.tracks);
		},
		setTracksInPlaylist: (state, action: PayloadAction<TrackState[]>) => {
			state.playlist = action.payload;
		},
		playPreviousTrack: (state, action: PayloadAction<void>) => {
			if (state.currentTrack)
				state.playlist.splice(0, 0, state.currentTrack);
			state.currentTrack = state.history.pop();
		},
		playNextTrack: (state, action: PayloadAction<void>) => {
			if (state.currentTrack)
				state.history.push(state.currentTrack);
			state.currentTrack = state.playlist.shift();
		},
		pushCurrentTrackToHistory: (state, action: PayloadAction<void>) => {
			if (state.currentTrack)
				state.history.push(state.currentTrack);
			state.currentTrack = undefined;
		},
		emptyPlaylist: (state, action: PayloadAction<void>) => {
			state.playlist = [];
		},
		setHistoryToPlaylist: (state, action: PayloadAction<void>) => {
			state.playlist = state.history;
			state.history = [];
		},
		stopCurrentTrack: (state, action: PayloadAction<void>) => {
			state.currentTrack = undefined;
		}
	},
})

export const { addTracksInPlaylist, setTracksInPlaylist, playPreviousTrack, playTrack, playNextTrack, emptyPlaylist, setHistoryToPlaylist, stopCurrentTrack ,pushCurrentTrackToHistory } = playerSlice.actions

export default playerSlice.reducer