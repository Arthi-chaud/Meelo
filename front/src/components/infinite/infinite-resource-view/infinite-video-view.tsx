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
import { SongSortingKeys, SongWithRelations } from "../../../models/song";
import { VideoWithRelations } from "../../../models/video";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import VideoTile from "../../tile/video-tile";
import { PaginationParameters } from "../../../models/pagination";
import Track from "../../../models/track";

const InfiniteVideoView = <T extends VideoWithRelations<"artist">>(
	props: InfiniteResourceViewProps<T, typeof SongSortingKeys> & {
		formatSubtitle?: (video: {
			song: SongWithRelations<"artist">;
			track: Track;
		}) => string;
	},
) => {
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof SongSortingKeys>>();

	return (
		<>
			<Controls
				onChange={setOptions}
				sortingKeys={SongSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				defaultLayout={"grid"}
				disableLayoutToggle
			/>
			<InfiniteView
				view={options?.view ?? "grid"}
				query={() => {
					const { key, exec } = props.query({
						view: options?.view ?? "grid",
						library: options?.library ?? null,
						sortBy:
							options?.sortBy ??
							props.initialSortingField ??
							"name",
						order:
							options?.order ??
							props.initialSortingOrder ??
							"asc",
					});
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
					<VideoTile
						video={item}
						formatSubtitle={
							item && props.formatSubtitle
								? () =>
										(
											props.formatSubtitle as Required<
												typeof props
											>["formatSubtitle"]
										)({
											song: item,
											track: item.track,
										})
								: undefined
						}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteVideoView;
