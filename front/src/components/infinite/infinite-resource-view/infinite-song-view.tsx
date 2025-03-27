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

import { useRouter } from "next/router";
import { useState } from "react";
import {
	type InfiniteQuery,
	type QueryClient,
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "../../../api/use-query";
import {
	SongSortingKeys,
	SongType,
	type SongWithRelations,
} from "../../../models/song";
import type { SongGroupWithRelations } from "../../../models/song-group";
import {
	emptyPlaylistAtom,
	playAfterAtom,
	playTrackAtom,
} from "../../../state/player";
import { store } from "../../../state/store";
import { DefaultItemSize } from "../../../utils/layout";
import { parseQueryParam, setQueryParam } from "../../../utils/query-param";
import type { SortingParameters } from "../../../utils/sorting";
import type Action from "../../actions/action";
import { PlayIcon, ShuffleIcon } from "../../icons";
import SongItem, { SongGroupItem } from "../../list-item/song-item";
import { Controls } from "../controls/controls";
import { useLibraryFilterControl } from "../controls/filters/library";
import { useTypeFilterControl } from "../controls/filters/resource-type";
import { useSortControl } from "../controls/sort";
import InfiniteView from "../infinite-view";

type SongModel = SongWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

type SongQueryProps = {
	libraries?: string[];
	types?: SongType[];
	random?: number;
} & SortingParameters<typeof SongSortingKeys>;

type SongGroupModel = SongGroupWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

type SongGroupQueryProps = {
	libraries?: string[];
	type?: SongType;
	random?: number;
};

const playSongsAction = (
	queryClient: QueryClient,
	query: () => InfiniteQuery<SongModel>,
) => {
	store.set(emptyPlaylistAtom);
	queryClient.client
		.fetchInfiniteQuery(prepareMeeloInfiniteQuery(query))
		.then(async (res) => {
			const songs = res.pages.flatMap(({ items }) => items);
			let i = 0;
			for (const song of songs) {
				if (i === 0) {
					store.set(playTrackAtom, {
						track: {
							...song.master,
							illustration: song.illustration,
						},
						artist: song.artist,
					});
				} else {
					store.set(playAfterAtom, {
						track: {
							...song.master,
							illustration: song.illustration,
						},
						artist: song.artist,
					});
				}
				i++;
			}
		});
};

const shuffleActionBase = {
	label: "shuffle" as const,
	icon: <ShuffleIcon />,
};

const playActionBase = {
	label: "playAll" as const,
	icon: <PlayIcon />,
};

type SongViewProps = {
	query: (q: SongQueryProps) => InfiniteQuery<SongModel>;
	onItemClick?: (song: SongModel) => void;
	disableShuffle?: boolean;
	subtitles?: Parameters<typeof SongItem>[0]["subtitles"];
	additionalActions?: Action[];
};

export const InfiniteSongView = (props: SongViewProps) => {
	const queryClient = useQueryClient();
	const shuffleAction = {
		...shuffleActionBase,
		onClick: () => {
			playSongsAction(queryClient, () =>
				props.query({
					...query,
					random: Math.floor(Math.random() * 10000),
				}),
			);
		},
	} as const;
	const playAction = {
		...playActionBase,
		onClick: () => {
			playSongsAction(queryClient, () => props.query(query));
		},
	} as const;

	/// state
	const [libraries, libraryFilterControl] = useLibraryFilterControl({
		multipleChoices: true,
	});
	const [types, songTypeFilterControl] = useTypeFilterControl({
		types: SongType,
		multipleChoices: true,
	});
	const [sort, sortControl] = useSortControl({
		defaultSortingKey: "name",
		sortingKeys: SongSortingKeys,
	});
	const query: SongQueryProps = {
		libraries: libraries,
		types: types,
		sortBy: sort.sort,
		order: sort.order,
	};

	return (
		<>
			<Controls
				filters={[libraryFilterControl, songTypeFilterControl]}
				sort={sortControl}
				actions={[
					[
						playAction,
						...(props.disableShuffle ? [] : [shuffleAction]),
					],
					...(props.additionalActions
						? [props.additionalActions]
						: []),
				]}
			/>
			<InfiniteView
				itemSize={DefaultItemSize}
				view={"list"}
				query={() => {
					return props.query(query);
				}}
				renderListItem={(item) => (
					<SongItem
						song={item}
						subtitles={props.subtitles}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={() => <></>}
			/>
		</>
	);
};

type SongGroupViewProps = {
	query: (q: SongGroupQueryProps) => InfiniteQuery<SongGroupModel>;
	onItemClick?: (song: SongGroupModel) => void;
	subtitles?: Parameters<typeof SongGroupItem>[0]["subtitles"];
	additionalActions?: Action[];
};

export const InfiniteSongGroupView = (props: SongGroupViewProps) => {
	const queryClient = useQueryClient();
	const playAction = {
		...playActionBase,
		onClick: () => {
			playSongsAction(queryClient, () => props.query(query));
		},
	} as const;

	/// state
	const [libraries, libraryFilterControl] = useLibraryFilterControl({
		multipleChoices: true,
	});
	const [type, songTypeFilterControl] = useTypeFilterControl({
		types: SongType,
		multipleChoices: false,
	});
	const query: SongGroupQueryProps = {
		libraries: libraries,
		type: type ?? undefined,
	};

	return (
		<>
			<Controls
				filters={[libraryFilterControl, songTypeFilterControl]}
				actions={[
					[playAction],
					...(props.additionalActions
						? [props.additionalActions]
						: []),
				]}
			/>
			<InfiniteView
				itemSize={DefaultItemSize}
				view={"list"}
				query={() => {
					return props.query(query);
				}}
				renderListItem={(item) => (
					<SongGroupItem
						song={item}
						subtitles={props.subtitles}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={() => <></>}
			/>
		</>
	);
};

type HybridSongViewProps = {
	song: SongViewProps;
	// If not specified, there will be no toggle button
	songGroup?: SongGroupViewProps;
};

// Infinite song View with a toggle for song groups
export const HybridInfiniteSongView = (props: HybridSongViewProps) => {
	const router = useRouter();
	const [useSongGroup, setUseSongGroup] = useState(
		parseQueryParam(router.query.groups, ["true", "false"]) === "true",
	);
	const toggleSongGroupAction: Action = {
		label: useSongGroup ? "showAllSongs" : "groupVersions",
		onClick: () => {
			setUseSongGroup((prev) => {
				setQueryParam(
					[
						["groups", (!prev).toString()],
						["type", null],
						["library", null],
						["order", null],
						["sort", null],
					],
					router,
				);
				return !prev;
			});
		},
	};

	if (useSongGroup && props.songGroup) {
		return (
			<InfiniteSongGroupView
				{...props.songGroup}
				additionalActions={[
					...(props.songGroup.additionalActions ?? []),
					toggleSongGroupAction,
				]}
			/>
		);
	}

	return (
		<InfiniteSongView
			{...props.song}
			additionalActions={[
				...(props.songGroup ? [toggleSongGroupAction] : []),
				...(props.song.additionalActions ?? []),
			]}
		/>
	);
};
