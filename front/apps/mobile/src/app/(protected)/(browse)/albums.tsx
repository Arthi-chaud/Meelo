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

import { getAlbums } from "@/api/queries";
import { AlbumSortingKeys } from "@/models/album";
import { GridIcon, ListIcon } from "@/ui/icons";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { AlbumItem } from "~/components/list-item/resource/album";
import { AlbumTile } from "~/components/tile/resource/album";

//TODO Tap header toscroll to top

export default function AlbumBrowseView() {
	const navigation = useNavigation();
	const [{ layout, itemSize }, { onUpdate: updateLayout }] = useLayoutControl(
		{
			defaultLayout: "grid",
			enableToggle: true,
		},
	);
	const {} = useSortControl({
		sortingKeys: AlbumSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={() =>
						updateLayout({
							layout: layout === "grid" ? "list" : "grid",
							itemSize,
						})
					}
				>
					{layout == "grid" ? <ListIcon /> : <GridIcon />}
				</TouchableOpacity>
			),
		});
	}, [layout]);
	return (
		<InfiniteView
			layout={layout}
			query={getAlbums({}, { sortBy: "name", order: "asc" }, [
				"artist",
				"illustration",
			])}
			renderItem={(album) => (
				<AlbumItem
					album={album}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
			renderTile={(album) => (
				<AlbumTile
					album={album}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
		/>
	);
}
