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
import type { QueryClient } from "@/api/hook";
import { type InfiniteQuery, transformPage } from "@/api/query";
import {
	SongSortingKeys,
	SongType,
	type SongWithRelations,
} from "@/models/song";
import type { SongGroupWithRelations } from "@/models/song-group";
import type { SortingParameters } from "@/models/sorting";
import { songTypeToTranslationKey } from "@/models/utils";
import { playFromInfiniteQuery } from "@/state/player";
import { store } from "@/state/store";
import { PlayIcon, ShuffleIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import { useQueryClient } from "~/api";
import type Action from "~/components/actions";
import { Controls } from "~/components/infinite/controls/controls";
import {
	useLibraryFiltersControl,
	useTypeFilterControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import SongItem, { SongGroupItem } from "~/components/list-item/resource/song";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";
import InfiniteList from "../list";

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

const playSongsAction = <T extends SongModel>(
	queryClient: QueryClient,
	query: InfiniteQuery<T>,
	afterId?: number,
) => {
	store.set(
		playFromInfiniteQuery,
		transformPage(query, (song) => ({
			track: {
				...song.master,
				illustration: song.illustration,
			},
			artist: song.artist,
			featuring: song.featuring,
			id: song.id,
		})),
		queryClient,
		afterId,
	);
};

const shuffleActionBase = {
	label: "actions.playback.shuffle" as const,
	icon: <ShuffleIcon />,
};

const playActionBase = {
	label: "actions.playback.playAll" as const,
	icon: <PlayIcon />,
};

type SongViewProps = {
	query: (q: SongQueryProps) => InfiniteQuery<SongModel>;
	onItemClick?: (song: SongModel) => void;
	disableShuffle?: boolean;
	disableSort?: boolean;
	subtitles?: Parameters<typeof SongItem>[0]["subtitles"];
	additionalActions?: Action[];
};

export const InfiniteSongView = (props: SongViewProps) => {
	const queryClient = useQueryClient();
	const shuffleAction = {
		...shuffleActionBase,
		onClick: () => {
			playSongsAction(
				queryClient,
				props.query({
					...query,
					random: getRandomNumber(),
				}),
			);
		},
	} as const;
	const playAction = {
		...playActionBase,
		onClick: () => {
			playSongsAction(queryClient, props.query(query));
		},
	} as const;

	/// state
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [types, songTypeFilterControl] = useTypeFiltersControl({
		types: SongType,
		translate: (s) => songTypeToTranslationKey(s, false),
	});
	const [sort, sortControl] = useSortControl({
		sortingKeys: SongSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
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
				sort={props.disableSort ? undefined : sortControl}
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
			<InfiniteList
				query={() => {
					return props.query(query);
				}}
				render={(item, items, index) => (
					<SongItem
						song={item}
						subtitles={props.subtitles}
						onClick={
							item &&
							(() => {
								const previousItemId = items[index - 1]?.id;
								playSongsAction(
									queryClient,
									props.query(query),
									previousItemId,
								);
								props.onItemClick?.(item);
							})
						}
					/>
				)}
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
			playSongsAction(queryClient, props.query(query));
		},
	} as const;

	/// state
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [type, songTypeFilterControl] = useTypeFilterControl({
		types: SongType,
		translate: (s) => songTypeToTranslationKey(s, false),
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
			<InfiniteList
				query={() => {
					return props.query(query);
				}}
				render={(item, items, index) => (
					<SongGroupItem
						song={item}
						subtitles={props.subtitles}
						onClick={
							item &&
							(() => {
								const previousItemId = items[index - 1]?.id;
								playSongsAction(
									queryClient,
									props.query(query),
									previousItemId,
								);
								props.onItemClick?.(item);
							})
						}
					/>
				)}
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
		label: useSongGroup
			? "browsing.controls.showAllSongs"
			: "browsing.controls.groupVersions",
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
