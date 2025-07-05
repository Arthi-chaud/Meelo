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

import { getArtists } from "@/api/queries";
import { ArtistSortingKeys } from "@/models/artist";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { ArtistItem } from "~/components/list-item/resource/artist";
import { ArtistTile } from "~/components/tile/resource/artist";

export default function ArtistBrowseView() {
	const [{ layout, itemSize }, { onUpdate: updateLayout }] = useLayoutControl(
		{
			defaultLayout: "list",
			enableToggle: true,
		},
	);
	const {} = useSortControl({
		sortingKeys: ArtistSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	return (
		<InfiniteView
			layout={layout}
			query={getArtists({}, { sortBy: "name", order: "asc" }, [
				"illustration",
			])}
			renderTile={(artist) => (
				<ArtistTile
					artist={artist}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
			renderItem={(artist) => (
				<ArtistItem
					artist={artist}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
		/>
	);
}
