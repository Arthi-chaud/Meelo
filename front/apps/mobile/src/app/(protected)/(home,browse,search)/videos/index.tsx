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

import { getArtist, getVideos } from "@/api/queries";
import { videoTypeToTranslationKey } from "@/models/utils";
import { VideoSortingKeys, VideoType } from "@/models/video";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useQuery } from "~/api";
import { ArtistHeader } from "~/components/artist-header";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { VideoItem } from "~/components/item/resource/video";
import { VideoTile } from "~/components/item/resource/video";

export default function VideoBrowseView() {
	const { artist: artistId } = useLocalSearchParams<{ artist?: string }>();
	const [{ layout }, layoutControl] = useLayoutControl({
		defaultLayout: "grid",
		enableToggle: true,
	});
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: VideoSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [types, albumTypeFilterControl] = useTypeFiltersControl({
		types: VideoType,
		translate: (t) => videoTypeToTranslationKey(t, false),
	});
	const Item = useMemo(
		() => (layout === "list" ? VideoItem : VideoTile),
		[layout],
	);
	const { data: artist } = useQuery(
		(artistId) => getArtist(artistId, ["illustration"]),
		artistId,
	);
	return (
		<InfiniteView
			layout={layout}
			header={artistId ? <ArtistHeader artist={artist} /> : undefined}
			controls={{
				layout: layoutControl,
				sort: sortControl,
				filters: [libraryFilterControl, albumTypeFilterControl],
			}}
			query={getVideos(
				{ library: libraries, type: types, artist: artistId },
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["artist", "illustration", "master"],
			)}
			render={(video) => (
				<Item
					video={video}
					subtitle={artistId ? "duration" : "artistName"}
					illustrationProps={{
						simpleColorPlaceholder: true,
						normalizedThumbnail: true,
					}}
				/>
			)}
		/>
	);
}
