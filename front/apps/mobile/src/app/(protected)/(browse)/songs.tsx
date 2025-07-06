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

import { getSongs } from "@/api/queries";
import { SongSortingKeys } from "@/models/song";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { SongItem } from "~/components/list-item/resource/song";

export default function SongBrowseView() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: SongSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	return (
		<InfiniteView
			layout={"list"}
			controls={{ sort: sortControl }}
			query={getSongs(
				{},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["artist", "illustration", "featuring"],
			)}
			render={(song) => (
				<SongItem
					song={song}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
		/>
	);
}
