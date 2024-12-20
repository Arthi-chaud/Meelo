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
import { ComponentProps, useState } from "react";
import { SongSortingKeys, SongType } from "../../../models/song";
import { VideoWithRelations } from "../../../models/video";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import VideoTile from "../../tile/video-tile";
import { PaginationParameters } from "../../../models/pagination";
import { PlayIcon, ShuffleIcon } from "../../icons";
import { PlayerActions, usePlayerContext } from "../../../contexts/player";
import {
	InfiniteQuery,
	QueryClient,
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "../../../api/use-query";

const playVideosAction = (
	emptyPlaylist: PlayerActions["emptyPlaylist"],
	playTrack: PlayerActions["playTrack"],
	playAfter: PlayerActions["playAfter"],
	queryClient: QueryClient,
	query: () => InfiniteQuery<VideoWithRelations<"artist" | "featuring">>,
) => {
	emptyPlaylist();
	queryClient.client
		.fetchInfiniteQuery(prepareMeeloInfiniteQuery(query))
		.then(async (res) => {
			const videos = res.pages.flatMap(({ items }) => items);
			let i = 0;
			for (const video of videos) {
				if (i == 0) {
					playTrack(video);
				} else {
					playAfter(video);
				}
				i++;
			}
		});
};

type AdditionalProps = {
	type?: SongType;
	random?: number;
};

const InfiniteVideoView = <
	T extends VideoWithRelations<"artist" | "featuring">,
>(
	props: InfiniteResourceViewProps<
		T,
		typeof SongSortingKeys,
		AdditionalProps
	> &
		Omit<ComponentProps<typeof VideoTile>, "video">,
) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [options, setOptions] =
		useState<OptionState<typeof SongSortingKeys, AdditionalProps>>();
	const query = {
		type:
			// @ts-ignore
			options?.type == "All" ? undefined : (options?.type as SongType),
		sortBy: options?.sortBy ?? props.initialSortingField ?? "name",
		order: options?.order ?? props.initialSortingOrder ?? "asc",
		view: "grid",
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
						label: (options?.type as SongType) ?? "All",
						name: "type",
						values: [
							"All",
							...SongType.filter(
								(type) =>
									![
										"Unknown",
										"Demo",
										"Clean",
										"Edit",
										"Acapella",
										"Instrumental",
									].includes(type),
							),
						],
						currentValue: options?.type,
					},
				]}
				onChange={setOptions}
				sortingKeys={SongSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				defaultLayout={"grid"}
				disableLayoutToggle
				actions={[playAction, shuffleAction]}
			/>
			<InfiniteView
				view={options?.view ?? "grid"}
				query={() => {
					const { key, exec } = props.query(query);
					return {
						key,
						exec: (pagination: PaginationParameters) =>
							exec(pagination).then((page) => {
								return {
									...page,
									items: page.items.map((item) => ({
										...item,
										illustration: item.track.illustration,
									})),
								};
							}),
					};
				}}
				renderListItem={(item) => <></>}
				renderGridItem={(item) => (
					<VideoTile video={item} subtitle={props.subtitle} />
				)}
			/>
		</>
	);
};

export default InfiniteVideoView;
