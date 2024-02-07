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

import { createContext, useContext, useState } from "react";
import Artist from "../models/artist";
import Release from "../models/release";
import Track from "../models/track";

export type TrackState = {
	track: Track;
	artist: Artist;
	release: Release;
};

export type PlayerState = {
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
};

export type PlayerActions = {
	playTrack: (track: TrackState) => void;
	playNext: (track: TrackState) => void;
	playAfter: (track: TrackState) => void;
	playTracks: (payload: { tracks: TrackState[]; cursor?: number }) => void;
	skipTrack: () => void;
	playPreviousTrack: () => void;
	reorder: (reordering: Record<"from" | "to", number>) => void;
	emptyPlaylist: () => void;
};

const PlayerContext = createContext<PlayerState & PlayerActions>({
	playlist: [],
	cursor: -1,
	playTrack: () => {},
	playNext: () => {},
	playAfter: () => {},
	playTracks: () => {},
	skipTrack: () => {},
	playPreviousTrack: () => {},
	reorder: () => {},
	emptyPlaylist: () => {},
});

const PlayerContextProvider = (props: { children: JSX.Element }) => {
	const [playerState, setPlayerState] = useState<PlayerState>({
		playlist: [],
		cursor: -1,
	});

	return (
		<PlayerContext.Provider
			value={{
				playlist: playerState.playlist,
				cursor: playerState.cursor,
				playTrack: (track: TrackState) => {
					setPlayerState({
						playlist: [track],
						cursor: 0,
					});
				},
				playNext: (track: TrackState) => {
					setPlayerState((state) => {
						return {
							cursor: state.cursor,
							playlist: state.playlist.splice(
								state.cursor + 1,
								0,
								track,
							),
						};
					});
				},
				playAfter: (track: TrackState) => {
					setPlayerState((state) => ({
						playlist: [...state.playlist, track],
						cursor: state.cursor,
					}));
				},
				playTracks: (payload: {
					tracks: TrackState[];
					cursor?: number;
				}) => {
					setPlayerState({
						playlist: payload.tracks,
						cursor: payload.cursor ?? 0,
					});
				},
				skipTrack: () => {
					setPlayerState((state) => {
						let newCursor = state.cursor + 1;
						if (newCursor >= state.playlist.length) {
							newCursor = -1;
						}
						return {
							cursor: newCursor,
							playlist: state.playlist,
						};
					});
				},
				playPreviousTrack: () => {
					setPlayerState((state) => {
						let newCursor = state.cursor;
						if (newCursor >= 0) {
							newCursor--;
						}
						return {
							cursor: newCursor,
							playlist: state.playlist,
						};
					});
				},
				reorder: (action: Record<"from" | "to", number>) => {
					setPlayerState((state) => {
						const [removed] = state.playlist.splice(action.from, 1);

						state.playlist.splice(action.to, 0, removed);
						return state;
					});
				},
				emptyPlaylist: () => {
					setPlayerState(() => {
						return {
							playlist: [],
							cursor: -1,
						};
					});
				},
			}}
		>
			{props.children}
		</PlayerContext.Provider>
	);
};

const usePlayerContext = () => useContext(PlayerContext);

export { usePlayerContext, PlayerContextProvider };
