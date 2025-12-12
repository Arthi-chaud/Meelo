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

import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { getArtists, getLabel } from "@/api/queries";
import { ArtistSortingKeys } from "@/models/artist";
import { useQuery } from "~/api";
import { useLibraryFiltersControl } from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { ArtistItem, ArtistTile } from "~/components/item/resource/artist";

export default function ArtistBrowseView() {
	const [{ layout }, layoutControl] = useLayoutControl({
		defaultLayout: "list",
		enableToggle: true,
	});
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: ArtistSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});

	const { label: labelId } = useLocalSearchParams<{
		label?: string;
	}>();
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();

	const { data: label } = useQuery((labelId) => getLabel(labelId), labelId);
	const Item = layout === "list" ? ArtistItem : ArtistTile;
	const nav = useNavigation();

	useEffect(() => {
		if (labelId !== undefined) {
			nav.setOptions({ headerTitle: label?.name ?? "" });
		}
	}, [labelId, label]);
	return (
		<InfiniteView
			layout={layout}
			controls={{
				layout: layoutControl,
				sort: sortControl,
				filters: [libraryFilterControl],
			}}
			query={getArtists(
				{ library: libraries, label: labelId },
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["illustration"],
			)}
			render={(artist) => <Item artist={artist} />}
		/>
	);
}
