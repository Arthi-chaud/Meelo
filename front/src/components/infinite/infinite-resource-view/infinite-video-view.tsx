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
import { SongSortingKeys } from "../../../models/song";
import { VideoWithRelations } from "../../../models/video";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import VideoTile from "../../tile/video-tile";

const InfiniteVideoView = (
	props: InfiniteResourceViewProps<
		VideoWithRelations<"artist">,
		typeof SongSortingKeys
	> & {
		formatSubtitle?: (video: VideoWithRelations<"artist">) => string;
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
				query={() =>
					props.query({
						view: options?.view ?? "grid",
						library: options?.library ?? null,
						sortBy: options?.sortBy ?? "name",
						order: options?.order ?? "asc",
					})
				}
				renderListItem={(item: VideoWithRelations<"artist">) => <></>}
				renderGridItem={(item: VideoWithRelations<"artist">) => (
					<VideoTile
						video={{
							...item.track,
							song: item,
						}}
						formatSubtitle={
							props.formatSubtitle
								? () =>
										(
											props.formatSubtitle as Required<
												typeof props
											>["formatSubtitle"]
										)(item)
								: undefined
						}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteVideoView;
