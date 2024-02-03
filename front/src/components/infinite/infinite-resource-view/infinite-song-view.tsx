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
	SongSortingKeys,
	SongType,
	SongWithRelations,
} from "../../../models/song";
import Controls, { OptionState } from "../../controls/controls";
import SongItem from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { PlayIcon, ShuffleIcon } from "../../icons";
import {
	InfiniteQuery,
	QueryClient,
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "../../../api/use-query";
import { useDispatch } from "react-redux";
import { emptyPlaylist, playAfter } from "../../../state/playerSlice";
import API from "../../../api/api";
import { Dispatch } from "@reduxjs/toolkit";

type AdditionalProps = {
	type?: SongType;
	random?: number;
};

const playSongsAction = (
	dispatch: Dispatch,
	queryClient: QueryClient,
	query: () => InfiniteQuery<SongWithRelations<"artist" | "featuring">>,
) => {
	dispatch(emptyPlaylist());
	queryClient.client
		.fetchInfiniteQuery(prepareMeeloInfiniteQuery(query))
		.then(async (res) => {
			const songs = res.pages.flatMap(({ items }) => items);

			for (const song of songs) {
				const { release, ...track } = await queryClient.fetchQuery(
					API.getMasterTrack(song.id, ["release"]),
				);

				dispatch(playAfter({ release, track, artist: song.artist }));
			}
		});
};

const InfiniteSongView = <T extends SongWithRelations<"artist" | "featuring">>(
	props: InfiniteResourceViewProps<
		T,
		typeof SongSortingKeys,
		AdditionalProps
	> &
		Pick<Parameters<typeof SongItem<T>>[0], "formatSubtitle"> & {
			disableShuffle?: boolean;
		},
) => {
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof SongSortingKeys, AdditionalProps>>();
	const queryClient = useQueryClient();
	const dispatch = useDispatch();
	const query = {
		type:
			// @ts-ignore
			options?.type == "All" ? undefined : (options?.type as SongType),
		sortBy: options?.sortBy ?? "name",
		order: options?.order ?? "asc",
		view: "grid",
		library: options?.library ?? null,
	} as const;
	const shuffleAction = {
		label: "shuffle",
		icon: <ShuffleIcon />,
		onClick: () => {
			playSongsAction(dispatch, queryClient, () =>
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
			playSongsAction(dispatch, queryClient, () => props.query(query));
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
							...SongType.filter((type) => type != "Unknown"),
						],
						currentValue: options?.type,
					},
				]}
				actions={[
					playAction,
					...(props.disableShuffle !== true ? [shuffleAction] : []),
				]}
				disableSorting={props.disableSorting}
				onChange={setOptions}
				sortingKeys={SongSortingKeys.filter(
					(key) => key !== "userPlayCount",
				)}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				disableLayoutToggle
				defaultLayout={"list"}
			/>
			<InfiniteView
				view={options?.view ?? "list"}
				query={() => props.query(query)}
				renderListItem={(item) => (
					<SongItem
						song={item}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
				renderGridItem={(item) => <></>}
			/>
		</>
	);
};

export default InfiniteSongView;
