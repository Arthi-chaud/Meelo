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
	type InfiniteQuery,
	type QueryClient,
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "../../../api/use-query";
import { type PlayerActions, usePlayerContext } from "../../../contexts/player";
import {
	VideoSortingKeys,
	VideoType,
	type VideoWithRelations,
} from "../../../models/video";
import { DefaultItemSize } from "../../../utils/layout";
import Controls, { type OptionState } from "../../controls/controls";
import { PlayIcon, ShuffleIcon } from "../../icons";
import VideoItem from "../../list-item/video-item";
import VideoTile from "../../tile/video-tile";
import InfiniteView from "../infinite-view";
import type InfiniteResourceViewProps from "./infinite-resource-view-props";

const playVideosAction = (
	emptyPlaylist: PlayerActions["emptyPlaylist"],
	playTrack: PlayerActions["playTrack"],
	playAfter: PlayerActions["playAfter"],
	queryClient: QueryClient,
	query: () => InfiniteQuery<
		VideoWithRelations<"artist" | "master" | "illustration">
	>,
) => {
	emptyPlaylist();
	queryClient.client
		.fetchInfiniteQuery(prepareMeeloInfiniteQuery(query))
		.then(async (res) => {
			const videos = res.pages
				.flatMap(({ items }) => items)
				.map((video) => ({
					...video,
					track: {
						...video.master,
						illustration: video.illustration,
					},
				}));
			let i = 0;
			for (const video of videos) {
				if (i === 0) {
					playTrack(video);
				} else {
					playAfter(video);
				}
				i++;
			}
		});
};

type AdditionalProps = {
	type?: VideoType;
	random?: number;
};

const InfiniteVideoView = <
	T extends VideoWithRelations<"artist" | "illustration" | "master">,
>(
	props: InfiniteResourceViewProps<
		T,
		typeof VideoSortingKeys,
		AdditionalProps
	> &
		Omit<ComponentProps<typeof VideoTile>, "video">,
) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [options, setOptions] =
		useState<OptionState<typeof VideoSortingKeys, AdditionalProps>>();
	const query = {
		type:
			// @ts-ignore
			options?.type === "All" ? undefined : (options?.type as VideoType),
		sortBy: options?.sortBy ?? props.initialSortingField ?? "name",
		order: options?.order ?? props.initialSortingOrder ?? "asc",
		view: "grid",
		itemSize: DefaultItemSize,
		library: options?.library ?? null,
	} as const;
	const { emptyPlaylist, playAfter, playTrack } = usePlayerContext();
	const playAction = {
		label: "playAll",
		icon: <PlayIcon />,
		onClick: () => {
			playVideosAction(
				emptyPlaylist,
				playTrack,
				playAfter,
				queryClient,
				() => props.query(query),
			);
		},
	} as const;
	const shuffleAction = {
		label: "shuffle",
		icon: <ShuffleIcon />,
		onClick: () => {
			playVideosAction(
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
	return (
		<>
			<Controls
				options={[
					{
						label: (options?.type as VideoType) ?? "All",
						name: "type",
						values: ["All", ...VideoType],
						currentValue: options?.type,
					},
				]}
				onChange={setOptions}
				sortingKeys={VideoSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light === true ? undefined : router}
				defaultLayout={"grid"}
				actions={[playAction, shuffleAction]}
			/>
			<InfiniteView
				itemSize={options?.itemSize ?? DefaultItemSize}
				view={options?.view ?? "grid"}
				query={() => {
					return props.query({
						...query,
						sortBy: query.sortBy,
					});
				}}
				renderListItem={(item) => (
					<VideoItem
						video={item}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={(item) => (
					<VideoTile
						video={item}
						subtitle={props.subtitle}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteVideoView;
