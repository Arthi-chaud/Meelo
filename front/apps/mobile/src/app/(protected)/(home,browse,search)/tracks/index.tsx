import { useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { getArtist, getSong, getTracks } from "@/api/queries";
import { TrackSortingKeys, type TrackWithRelations } from "@/models/track";
import { playTrackAtom } from "@/state/player";
import { useQuery, useQueryClient } from "~/api";
import { useLibraryFiltersControl } from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { TrackItem } from "~/components/item/resource/track";
import { SongHeader } from "~/components/resource-header";

export default function TracksView() {
	const queryClient = useQueryClient();
	const playTrack = useSetAtom(playTrackAtom);
	const { song: songId } = useLocalSearchParams<{
		song?: string;
	}>();
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: TrackSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();

	const { data: song } = useQuery(
		(songId) =>
			getSong(songId, ["artist", "illustration", "featuring", "master"]),
		songId,
	);
	const onItemPress = useCallback(
		(track: TrackWithRelations<"song" | "illustration" | "video">) =>
			queryClient
				.fetchQuery(getArtist((track.song ?? track.video)!.artistId))
				.then((artist) => playTrack({ artist, track })),
		[queryClient],
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
				["illustration", "release", "song", "video"],
			)}
			render={(track) => (
				<TrackItem
					onPress={() => track && onItemPress(track)}
					track={track}
					illustrationProps={{}}
				/>
			)}
		/>
	);
}
