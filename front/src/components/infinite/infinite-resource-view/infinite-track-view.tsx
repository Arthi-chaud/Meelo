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
	TrackSortingKeys,
	type TrackWithRelations,
} from "../../../models/track";
import Controls, { type OptionState } from "../../controls/controls";
import TrackItem from "../../list-item/track-item";
import InfiniteView from "../infinite-view";
import type InfiniteResourceViewProps from "./infinite-resource-view-props";
import { DefaultItemSize } from "../../../utils/layout";

const InfiniteTrackView = (
	props: InfiniteResourceViewProps<
		TrackWithRelations<"video" | "song" | "release" | "illustration">,
		typeof TrackSortingKeys
	>,
) => {
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof TrackSortingKeys>>();

	return (
		<>
			<Controls
				onChange={setOptions}
				sortingKeys={TrackSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light === true ? undefined : router}
				disableLayoutToggle
				defaultLayout={"list"}
			/>
			<InfiniteView
				itemSize={options?.itemSize ?? DefaultItemSize}
				view={options?.view ?? "list"}
				query={() =>
					props.query({
						library: options?.library ?? null,
						view: "list",
						sortBy: options?.sortBy ?? "name",
						order: options?.order ?? "asc",
					})
				}
				renderListItem={(item) => (
					<TrackItem
						track={item}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={() => <></>}
			/>
		</>
	);
};

export default InfiniteTrackView;
