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
import type API from "@/api";
import type { QueryClient } from "@/api/hook";
import {
	type InfiniteQuery,
	toTanStackInfiniteQuery,
	transformPage,
} from "@/api/query";
import type Artist from "@/models/artist";
import type Resource from "@/models/resource";
import type { SongWithRelations } from "@/models/song";
import type { TrackWithRelations } from "@/models/track";

export type TrackState = {
	track: TrackWithRelations<"illustration">;
	artist: Artist;
	featuring: Artist[] | undefined; // We lazy load featuring artists
};

export type LoopMode = "none" | "queue" | "track";

export type PlayerState = {
	loopMode: LoopMode;
	loading: boolean;
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

	infinite: {
		// Infinite query used to populate queue
		query: InfiniteQuery<TrackState & Resource>;
		// the number of items to 'skip' for the next query
		afterId: number;
	} | null;
};

export const nextLoopMode = (m: LoopMode) => {
	switch (m) {
		case "none":
			return "queue";
		case "queue":
			return "track";
		case "track":
			return "none";
		default:
			return "none";
	}
};

const _resetOrKeepLoopMode = (m: LoopMode) => (m === "track" ? "none" : m);

export const cursorAtom = atom((get) => get(_playerState).cursor);
export const loopModeAtom = atom(
	(get) => get(_playerState).loopMode,
	(get, set, m: LoopMode) => {
		set(_playerState, {
			...get(_playerState),
			loopMode: m,
		});
	},
);

export const playlistAtom = atom((get) => get(_playerState).playlist);
export const playlistLoadingAtom = atom((get) => get(_playerState).loading);
export const infiniteQueryAtom = atom((get) => get(_playerState).infinite);
export const playTrackAtom = atom(null, (get, set, track: TrackState) => {
	set(_playerState, {
		loading: false,
		playlist: [track],
		cursor: 0,
		loopMode: _resetOrKeepLoopMode(get(_playerState).loopMode),
		infinite: null,
	});
});
export const playTracksAtom = atom(
	null,
	(
		get,
		set,
		{ tracks, cursor }: { tracks: TrackState[]; cursor?: number },
	) => {
		set(_playerState, {
			loading: false,
			playlist: tracks,
			loopMode: _resetOrKeepLoopMode(get(_playerState).loopMode),
			cursor: cursor ?? 0,
			infinite: null,
		});
	},
);

// NOTE: Ignores the 'track' loop mode rule
export const skipTrackAtom = atom(
	null,
	(get, set, queryClient: QueryClient) => {
		const state = get(_playerState);
		let newCursor = state.cursor + 1;
		if (newCursor >= state.playlist.length) {
			newCursor = state.loopMode === "queue" ? 0 : -1;
		}
		set(_playerState, {
			...state,
			cursor: newCursor,
		});
		if (state.infinite && newCursor >= state.playlist.length - 2) {
			set(loadNextQueuePageAtom, queryClient);
		}
	},
);

export const infiniteSongQueryToPlayerQuery = <
	S extends SongWithRelations<"artist" | "illustration" | "master">,
>(
	q: InfiniteQuery<any, S>,
): InfiniteQuery<any, TrackState & Resource> => {
	return transformPage(q, (s) => ({
		id: s.id,
		track: { ...s.master, song: s, illustration: s.illustration },
		artist: s.artist,
		featuring: "featuring" in s ? (s.featuring as Artist[]) : undefined,
	}));
};

export const playFromInfiniteQuery = atom(
	null,
	async (
		get,
		set,
		// We merge TrackState + Resource to give the query handler an Id to 'afterId' from
		query: InfiniteQuery<any, TrackState & Resource>,
		queryClient: QueryClient,
		afterId?: number,
		startAtId?: number,
	) => {
		const loopMode = _resetOrKeepLoopMode(get(_playerState).loopMode);
		set(_playerState, {
			loading: true,
			cursor: -1,
			playlist: [],
			loopMode,
			infinite: { query, afterId: -1 },
		});
		if (afterId !== undefined) {
			set(
				_playerState,
				await loadNextQueuePage(
					{
						loading: false,
						loopMode,
						cursor: 0,
						playlist: [],
						infinite: { query, afterId },
					},
					queryClient,
				),
			);
			return;
		}
		const queryOpt = toTanStackInfiniteQuery(queryClient.api, () => query);
		queryClient.client.fetchInfiniteQuery(queryOpt).then((res) => {
			const items = res.pages.flatMap(({ items }) =>
				query.transformer ? items.map(query.transformer) : items,
			);
			if (items.length === 0) {
				return;
			}
			set(_playerState, {
				loading: false,
				loopMode: _resetOrKeepLoopMode(get(_playerState).loopMode),
				cursor: startAtId
					? Math.max(
							0,
							items.findIndex((i) => i.id === startAtId),
						)
					: 0,
				playlist: items,
				infinite:
					items.length < queryClient.api.pageSize
						? null
						: { query, afterId: items.at(-1)!.id },
			});
		});
	},
);

const loadNextQueuePage = (state: PlayerState, queryClient: QueryClient) => {
	if (!state.infinite) {
		return state;
	}
	const afterId = state.infinite.afterId;
	const pageQuery = {
		// TODO see next atom
		key: [...state.infinite.query.key, `after-${afterId}`],
		exec: (_api: API) => () =>
			state.infinite!.query.exec(_api)({
				afterId: state.infinite!.afterId,
			}),
	};
	const queryOpt = toTanStackInfiniteQuery(queryClient.api, () => pageQuery);
	return queryClient.client
		.fetchQuery({
			...queryOpt,
			initialPageParam: undefined,
			staleTime: 0,
		})
		.then((res) => {
			const afterId = res.items.at(-1)?.id;
			const isEnd =
				res.metadata.next === null ||
				res.items.length < queryClient.api.pageSize;
			const items = state.infinite?.query.transformer
				? res.items.map(state.infinite.query.transformer)
				: res.items;
			return {
				loading: false,
				cursor: state.cursor,

				loopMode: _resetOrKeepLoopMode(state.loopMode),
				playlist: [...state.playlist, ...items],
				infinite:
					afterId && !isEnd
						? {
								query: state.infinite!.query,
								afterId: afterId,
							}
						: null,
			};
		});
};

export const loadNextQueuePageAtom = atom(
	null,
	async (get, set, queryClient: QueryClient) => {
		const state = get(_playerState);
		set(_playerState, await loadNextQueuePage(state, queryClient));
	},
);

// NOTE: Ignores the 'track' loop mode rule
export const playPreviousTrackAtom = atom(null, (get, set) => {
	const state = get(_playerState);

	let newCursor = state.cursor;
	if (state.loopMode === "queue" && state.cursor === 0) {
		newCursor = state.playlist.length - 1;
	} else if (newCursor >= 0) {
		newCursor--;
	}
	set(_playerState, {
		...state,
		cursor: newCursor,
	});
});
export const emptyPlaylistAtom = atom(null, (get, set) =>
	set(_playerState, {
		loading: false,
		playlist: [],
		cursor: -1,
		loopMode: _resetOrKeepLoopMode(get(_playerState).loopMode),
		infinite: null,
	}),
);

export const removeTrackAtom = atom(null, (get, set, trackIndex: number) => {
	const state = get(_playerState);
	set(_playerState, {
		...state,
		playlist: state.playlist.filter((_, i) => i !== trackIndex),
	});
});
export const playNextAtom = atom(null, (get, set, track: TrackState) => {
	const state = get(_playerState);
	state.playlist.splice(state.cursor + 1, 0, track);
	const newState = { ...state };
	set(_playerState, newState);
});

export const playAfterAtom = atom(null, (get, set, track: TrackState) => {
	const state = get(_playerState);
	set(_playerState, {
		...state,
		playlist: [...state.playlist, track],
	});
});

export const reorderAtom = atom(
	null,
	(get, set, action: Record<"from" | "to", number>) => {
		const state = get(_playerState);
		const [removed] = state.playlist.splice(action.from, 1);
		state.playlist.splice(action.to, 0, removed);
		set(_playerState, {
			...state,
			playlist: state.playlist,
		});
	},
);
const _playerState = atom<PlayerState>({
	loading: false,
	loopMode: "none",
	playlist: [],
	cursor: -1,
	infinite: null,
});
