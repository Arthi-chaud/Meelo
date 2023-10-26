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
	props: InfiniteResourceViewProps<Playlist, typeof PlaylistSortingKeys>
) => {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof PlaylistSortingKeys>>();

	return <>
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
			query={() => props.query({
				library: null,
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
				view: "grid"
			})}
			renderListItem={(item: Playlist) => <PlaylistItem playlist={item} key={item.id} />}
			renderGridItem={(item: Playlist) => <PlaylistTile playlist={item} key={item.id} />}
		/>
	</>;
};

export default InfinitePlaylistView;
