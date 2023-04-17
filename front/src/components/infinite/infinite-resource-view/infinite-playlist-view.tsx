import { useRouter } from "next/router";
import { useState } from "react";
import Playlist, { PlaylistSortingKeys } from "../../../models/playlist";
import Controls, { OptionState } from "../../controls/controls";
import PlaylistItem from "../../list-item/playlist-item";
import PlaylistTile from "../../tile/playlist-tile";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";

const InfinitePlaylistView = (
	props: InfiniteResourceViewProps<Playlist, typeof PlaylistSortingKeys>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof PlaylistSortingKeys>>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={PlaylistSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
			router={props.light == true ? undefined : router}
			defaultLayout={props.defaultLayout ?? "list"}
		/>
		<InfiniteView
			view={options?.view ?? props.defaultLayout ?? "list"}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			})}
			renderListItem={(item: Playlist) => <PlaylistItem playlist={item} key={item.id} />}
			renderGridItem={(item: Playlist) => <PlaylistTile playlist={item} key={item.id} />}
		/>
	</>;
};

export default InfinitePlaylistView;
