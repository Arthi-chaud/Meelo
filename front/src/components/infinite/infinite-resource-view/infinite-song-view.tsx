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
import { type ComponentProps, useState } from "react";
import {
	SongSortingKeys,
	SongType,
	type SongWithRelations,
} from "../../../models/song";
import Controls, { type OptionState } from "../../controls/controls";
import SongItem, { SongGroupItem } from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import type InfiniteResourceViewProps from "./infinite-resource-view-props";
import { PlayIcon, ShuffleIcon } from "../../icons";
import {
	type InfiniteQuery,
	type QueryClient,
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "../../../api/use-query";
import { type PlayerActions, usePlayerContext } from "../../../contexts/player";
import {
	SongGroupSortingKeys,
	type SongGroupWithRelations,
} from "../../../models/song-group";

type AdditionalProps = {
	type?: SongType;
	// if true, show song groups instead of songs
	groups?: boolean;
	random?: number;
};

const playSongsAction = (
	emptyPlaylist: PlayerActions["emptyPlaylist"],
	playTrack: PlayerActions["playTrack"],
	playAfter: PlayerActions["playAfter"],
	queryClient: QueryClient,
	query: () => InfiniteQuery<
		SongWithRelations<"artist" | "featuring" | "master" | "illustration">
	>,
) => {
	emptyPlaylist();
	queryClient.client
		.fetchInfiniteQuery(prepareMeeloInfiniteQuery(query))
		.then(async (res) => {
			const songs = res.pages.flatMap(({ items }) => items);
			let i = 0;
			for (const song of songs) {
				if (i === 0) {
					playTrack({
						track: {
							...song.master,
							illustration: song.illustration,
						},
						artist: song.artist,
					});
				} else {
					playAfter({
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

const InfiniteSongView = <
	T extends SongWithRelations<
		"artist" | "featuring" | "master" | "illustration"
	>,
>(
	props: InfiniteResourceViewProps<
		T,
		typeof SongSortingKeys,
		AdditionalProps
	> &
		Pick<ComponentProps<typeof SongItem<T>>, "subtitles"> & {
			disableShuffle?: boolean;
			groupsQuery?: (
				p: OptionState<typeof SongGroupSortingKeys> & AdditionalProps,
			) => InfiniteQuery<
				SongGroupWithRelations<
					"artist" | "featuring" | "master" | "illustration"
				>
			>;
		},
) => {
	const disableGroupingVersions = !props.groupsQuery;
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof SongSortingKeys, AdditionalProps>>();
	const queryClient = useQueryClient();
	const { emptyPlaylist, playAfter, playTrack } = usePlayerContext();
	const query = {
		type:
			// @ts-ignore
			options?.type === "All" ? undefined : (options?.type as SongType),
		sortBy: options?.sortBy ?? props.initialSortingField ?? "name",
		order: options?.order ?? props.initialSortingOrder ?? "asc",
		view: "grid",
		groups: disableGroupingVersions ? false : (options?.groups ?? false),
		library: options?.library ?? null,
	} as const;
	const shuffleAction = {
		label: "shuffle",
		icon: <ShuffleIcon />,
		onClick: () => {
			playSongsAction(
				emptyPlaylist,
				playTrack,
				playAfter,
				queryClient,
				() =>
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
			playSongsAction(
				emptyPlaylist,
				playTrack,
				playAfter,
				queryClient,
				() => props.query(query),
			);
		},
	} as const;

	return (
		<>
			<Controls
				options={[
					{
						label: (options?.type as SongType) ?? "All",
						name: "type",
						values: [
							"All",
							...SongType.filter((type) => type !== "Unknown"),
						],
						currentValue: options?.type,
					},
				]}
				actions={[
					playAction,
					...(props.disableShuffle !== true && !options?.groups
						? [shuffleAction]
						: []),
				]}
				toggles={
					disableGroupingVersions
						? []
						: [
								{
									name: "groups",
									label: options?.groups
										? "showAllSongs"
										: "groupVersions",
								},
							]
				}
				disableSorting={options?.groups || props.disableSorting}
				onChange={setOptions}
				sortingKeys={
					options?.groups ? SongGroupSortingKeys : SongSortingKeys
				}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light === true ? undefined : router}
				disableLayoutToggle
				defaultLayout={"list"}
			/>
			{options?.groups ? (
				<InfiniteView
					view={"list"}
					query={() => {
						return props.groupsQuery!({
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
					view={"list"}
					query={() => {
						return props.query({
							...query,
							sortBy: query.sortBy,
						});
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
