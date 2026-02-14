import { getPlaylists } from "@/api/queries";
import { PlaylistSortingKeys } from "@/models/playlist";
import {
	CreatePlaylist,
	useCreatePlaylistFormModal,
} from "~/actions/playlist/create-update";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import {
	PlaylistItem,
	PlaylistTile,
} from "~/components/item/resource/playlist";

export default function PlaylistsView() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: PlaylistSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [{ layout }, layoutControl] = useLayoutControl({
		defaultLayout: "list",
		enableToggle: true,
	});
	const { openFormModal } = useCreatePlaylistFormModal();
	const Item = layout === "list" ? PlaylistItem : PlaylistTile;

	return (
		<InfiniteView
			layout={layout}
			controls={{
				actions: [CreatePlaylist(openFormModal)],
				sort: sortControl,
				layout: layoutControl,
			}}
			query={getPlaylists(
				{},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["illustration"],
			)}
			render={(playlist) => <Item playlist={playlist} />}
		/>
	);
}
