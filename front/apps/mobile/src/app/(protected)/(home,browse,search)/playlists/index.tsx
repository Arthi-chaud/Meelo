import { getPlaylists } from "@/api/queries";
import { PlaylistSortingKeys } from "@/models/playlist";
import {
	CreatePlaylist,
	useCreatePlaylistFormModal,
} from "~/actions/playlist/create-update";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { PlaylistItem } from "~/components/item/resource/playlist";

export default function PlaylistsView() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: PlaylistSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const { openFormModal } = useCreatePlaylistFormModal();

	return (
		<InfiniteView
			layout={"list"}
			controls={{
				actions: [CreatePlaylist(openFormModal)],
				sort: sortControl,
			}}
			query={getPlaylists(
				{},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["illustration"],
			)}
			render={(playlist) => <PlaylistItem playlist={playlist} />}
		/>
	);
}
