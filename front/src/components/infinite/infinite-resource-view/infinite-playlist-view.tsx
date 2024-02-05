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
import Playlist, { PlaylistSortingKeys } from "../../../models/playlist";
import Controls, { OptionState } from "../../controls/controls";
import PlaylistItem from "../../list-item/playlist-item";
import PlaylistTile from "../../tile/playlist-tile";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { CreatePlaylistAction } from "../../actions/playlist";
import { useQueryClient } from "../../../api/use-query";

const InfinitePlaylistView = (
	props: InfiniteResourceViewProps<Playlist, typeof PlaylistSortingKeys>,
) => {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof PlaylistSortingKeys>>();

	return (
		<>
			<Controls
				actions={[CreatePlaylistAction(queryClient)]}
				onChange={setOptions}
				disableLibrarySelector
				sortingKeys={PlaylistSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				defaultLayout={props.defaultLayout ?? "list"}
			/>
			<InfiniteView
				view={options?.view ?? props.defaultLayout ?? "list"}
				query={() =>
					props.query({
						library: null,
						sortBy: options?.sortBy ?? "name",
						order: options?.order ?? "asc",
						view: "grid",
					})
				}
				renderListItem={(item) => <PlaylistItem playlist={item} />}
				renderGridItem={(item) => <PlaylistTile playlist={item} />}
			/>
		</>
	);
};

export default InfinitePlaylistView;
