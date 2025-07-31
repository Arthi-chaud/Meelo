import { getSong, getTracks } from "@/api/queries";
import { TrackSortingKeys } from "@/models/track";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "~/api";
import { useLibraryFiltersControl } from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { TrackItem } from "~/components/item/resource/track";
import { SongHeader } from "~/components/resource-header";

export default function TracksView() {
	const { song: songId } = useLocalSearchParams<{
		song?: string;
	}>();
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: TrackSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();

	const { data: song } = useQuery(
		(songId) => getSong(songId, ["artist", "illustration", "featuring"]),
		songId,
	);
	return (
		<InfiniteView
			layout={"list"}
			header={
				songId !== undefined ? <SongHeader song={song} /> : undefined
			}
			controls={{
				sort: sortControl,
				filters: [libraryFilterControl],
			}}
			query={getTracks(
				{
					song: songId,
					library: libraries,
				},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["illustration", "release"],
			)}
			render={(track) => (
				<TrackItem
					track={track}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
		/>
	);
}
