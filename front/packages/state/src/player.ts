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
import { type InfiniteQuery, toTanStackInfiniteQuery } from "@/api/query";
import type Artist from "@/models/artist";
import type Resource from "@/models/resource";
import type { TrackWithRelations } from "@/models/track";

export type TrackState = {
	track: TrackWithRelations<"illustration">;
	artist: Artist;
	featuring: Artist[] | undefined; // We lazy load featuring artists
};

export type PlayerState = {
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

export const cursorAtom = atom((get) => get(_playerState).cursor);
export const playlistAtom = atom((get) => get(_playerState).playlist);
export const playlistLoadingAtom = atom((get) => get(_playerState).loading);
export const infiniteQueryAtom = atom((get) => get(_playerState).infinite);
export const playTrackAtom = atom(null, (_, set, track: TrackState) => {
	set(_playerState, {
		loading: false,
		playlist: [track],
		cursor: 0,
		infinite: null,
	});
});
export const playTracksAtom = atom(
	null,
	(_, set, { tracks, cursor }: { tracks: TrackState[]; cursor?: number }) => {
		set(_playerState, {
			loading: false,
			playlist: tracks,
			cursor: cursor ?? 0,
			infinite: null,
		});
	},
);
export const skipTrackAtom = atom(
	null,
	(get, set, queryClient: QueryClient) => {
		const state = get(_playerState);

		let newCursor = state.cursor + 1;
		if (newCursor >= state.playlist.length) {
			newCursor = -1;
		}
		set(_playerState, {
			loading: state.loading,
			cursor: newCursor,
			playlist: state.playlist,
			infinite: state.infinite,
		});
		if (state.infinite && newCursor >= state.playlist.length - 2) {
			set(loadNextQueuePageAtom, queryClient);
		}
	},
);

export const playFromInfiniteQuery = atom(
	null,
	async (
		_get,
		set,
		// We merge TrackState + Resource to give the query handler an Id to 'afterId' from
		query: InfiniteQuery<any, TrackState & Resource>,
		queryClient: QueryClient,
		afterId?: number,
		startAtId?: number,
	) => {
		set(_playerState, {
			loading: true,
			cursor: -1,
			playlist: [],
			infinite: { query, afterId: -1 },
		});
		if (afterId !== undefined) {
			set(
				_playerState,
				await loadNextQueuePage(
					{
						loading: false,
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

export const playPreviousTrackAtom = atom(null, (get, set) => {
	const state = get(_playerState);
	let newCursor = state.cursor;
	if (newCursor >= 0) {
		newCursor--;
	}
	set(_playerState, {
		loading: state.loading,
		cursor: newCursor,
		playlist: state.playlist,
		infinite: state.infinite,
	});
});
export const emptyPlaylistAtom = atom(null, (_, set) =>
	set(_playerState, {
		loading: false,
		playlist: [],
		cursor: -1,
		infinite: null,
	}),
);

export const removeTrackAtom = atom(null, (get, set, trackIndex: number) => {
	const state = get(_playerState);
	set(_playerState, {
		loading: state.loading,
		cursor: state.cursor,
		playlist: state.playlist.filter((_, i) => i !== trackIndex),
		infinite: state.infinite,
	});
});
export const playNextAtom = atom(null, (get, set, track: TrackState) => {
	const state = get(_playerState);
	state.playlist.splice(state.cursor + 1, 0, track);
	const newState = {
		cursor: state.cursor,
		playlist: state.playlist,
		infinite: state.infinite,
		loading: state.loading,
	};
	set(_playerState, newState);
});

export const playAfterAtom = atom(null, (get, set, track: TrackState) => {
	const state = get(_playerState);
	set(_playerState, {
		loading: state.loading,
		playlist: [...state.playlist, track],
		cursor: state.cursor,
		infinite: state.infinite,
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
	playlist: [],
	cursor: -1,
	infinite: null,
});
