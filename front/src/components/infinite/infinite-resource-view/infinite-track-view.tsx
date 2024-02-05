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
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import Controls, { OptionState } from "../../controls/controls";
import { useRouter } from "next/router";
import { TrackSortingKeys, TrackWithRelations } from "../../../models/track";
import TrackItem from "../../list-item/track-item";
import InfiniteView from "../infinite-view";

const InfiniteTrackView = (
	props: InfiniteResourceViewProps<
		TrackWithRelations<"song" | "release">,
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
				router={props.light == true ? undefined : router}
				disableLayoutToggle
				defaultLayout={"list"}
			/>
			<InfiniteView
				view={options?.view ?? "list"}
				query={() =>
					props.query({
						library: options?.library ?? null,
						view: "list",
						sortBy: options?.sortBy ?? "name",
						order: options?.order ?? "asc",
					})
				}
				renderListItem={(item) => <TrackItem track={item} />}
				renderGridItem={(item) => <></>}
			/>
		</>
	);
};

export default InfiniteTrackView;
