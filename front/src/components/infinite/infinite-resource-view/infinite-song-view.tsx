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
import {
	SongGroupSortingKeys,
	type SongGroupWithRelations,
} from "../../../models/song-group";
import {
	emptyPlaylistAtom,
	playAfterAtom,
	playTrackAtom,
} from "../../../state/player";
import { store } from "../../../state/store";
import { DefaultItemSize } from "../../../utils/layout";
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

type SongGroupModel = SongGroupWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

type Props = {
	query: (q: QueryProps) => InfiniteQuery<SongModel>;
	// TODO Fix type so that the sorting type + song type match
	songGroupsQuery?: (q: QueryProps) => InfiniteQuery<SongGroupModel>;
	onItemClick?: (song: SongModel) => void;
	disableShuffle?: boolean;
	subtitles?: Parameters<typeof SongItem>[0]["subtitles"];
};

type QueryProps = {
	libraries?: string[];
	types?: SongType[];
	// if true, show song groups instead of songs
	groups?: boolean;
	random?: number;
} & SortingParameters<typeof SongSortingKeys>;

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

const InfiniteSongView = (props: Props) => {
	const queryClient = useQueryClient();
	const [useSongGroup, setUseSongGroup] = useState(false);
	/// Actions
	const toggleSongGroup: Action = {
		label: useSongGroup ? "showAllSongs" : "groupVersions",
		onClick: () => setUseSongGroup((t) => !t),
	};
	const shuffleAction = {
		label: "shuffle",
		icon: <ShuffleIcon />,
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
		label: "playAll",
		icon: <PlayIcon />,
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
		sortingKeys: useSongGroup ? SongGroupSortingKeys : SongSortingKeys,
	});
	const query: QueryProps = {
		libraries: libraries,
		types: types,
		sortBy: sort.sort,
		order: sort.order,
	};

	return (
		<>
			{/* Song Grouo do not support having multiple song types */}
			<Controls
				filters={[libraryFilterControl, songTypeFilterControl]}
				sort={useSongGroup ? undefined : sortControl}
				actions={[
					[
						playAction,
						...(props.disableShuffle ? [] : [shuffleAction]),
					],
					props.songGroupsQuery ? [toggleSongGroup] : [],
				]}
			/>
			{useSongGroup ? (
				<InfiniteView
					itemSize={DefaultItemSize}
					view={"list"}
					query={() => {
						return props.songGroupsQuery!({
							...query,
							sortBy: "name",
						});
					}}
					renderListItem={(item) => (
						<SongGroupItem
							song={item}
							subtitles={props.subtitles}
						/>
					)}
					renderGridItem={() => <></>}
				/>
			) : (
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
			)}
		</>
	);
};

export default InfiniteSongView;
